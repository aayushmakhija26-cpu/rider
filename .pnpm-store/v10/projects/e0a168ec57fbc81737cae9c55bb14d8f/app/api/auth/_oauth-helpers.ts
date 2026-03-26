import { prisma } from '@/src/lib/db'
import type { DealerUser } from '@prisma/client'

type OAuthParams = {
  email: string
  name?: string
  provider: string
  providerId: string
}

export async function findOrCreateOAuthUser({
  email,
  name,
  provider,
  providerId,
}: OAuthParams): Promise<DealerUser> {
  // 1. Returning user — find by provider + providerId (fastest path, uses unique index)
  const existingAccount = await prisma.oAuthAccount.findFirst({
    where: { provider, providerId },
    include: { dealerUser: true },
  })
  if (existingAccount) return existingAccount.dealerUser

  // 2. Existing users by email — link all matching DealerUsers across all tenants (IG-2)
  //    skipDuplicates handles race conditions where two concurrent requests both reach this path
  const existingUsers = await prisma.dealerUser.findMany({ where: { email } })
  if (existingUsers.length > 0) {
    await prisma.oAuthAccount.createMany({
      data: existingUsers.map((u) => ({
        dealerUserId: u.id,
        provider,
        providerId,
      })),
      skipDuplicates: true,
    })
    return existingUsers[0]
  }

  // 3. New user — create Dealer + DealerUser + OAuthAccount atomically
  //    The @@unique([provider, providerId]) on OAuthAccount causes one side of a race to fail,
  //    which is caught by the callback and redirected to oauth_failed.
  try {
    return await prisma.$transaction(async (tx) => {
      // Reuse existing Dealer if one already shares this email (edge case)
      let dealer = await tx.dealer.findFirst({ where: { email } })
      if (!dealer) {
        dealer = await tx.dealer.create({
          data: { name: deriveNameFromEmail(email), email },
        })
      }
      const dealerUser = await tx.dealerUser.create({
        data: {
          dealerId: dealer.id,
          email,
          name: name ?? null,
          passwordHash: null,
          role: 'DEALER_ADMIN',
        },
      })
      await tx.oAuthAccount.create({
        data: { dealerUserId: dealerUser.id, provider, providerId },
      })
      // Initialize onboarding steps for the new dealer
      await tx.onboardingStep.createMany({
        data: ['branding', 'dms', 'staff', 'billing'].map((stepName) => ({
          dealerId: dealer.id,
          stepName,
          status: 'pending',
        })),
        skipDuplicates: true,
      })
      return dealerUser
    })
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      // Race condition: two concurrent OAuth requests for same email. The callback
      // will catch this throw and redirect to /sign-in?error=oauth_failed.
      throw new Error('OAuth registration conflict: concurrent request won the race')
    }
    throw error
  }
}

function deriveNameFromEmail(email: string): string {
  const domain = email.split('@')[1] ?? 'My Dealership'
  const name = domain.split('.')[0] ?? 'My Dealership'
  return name.charAt(0).toUpperCase() + name.slice(1) + ' Auto'
}
