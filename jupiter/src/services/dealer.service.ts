import { prisma } from '@/src/lib/db';
import type { Dealer, DealerUser } from '@prisma/client';

/**
 * Create a Dealer and a DEALER_ADMIN DealerUser atomically.
 * Used for email/password registration.
 */
export async function createDealerWithAdmin(
  email: string,
  dealershipName: string,
  passwordHash: string
): Promise<{ dealer: Dealer; user: DealerUser }> {
  return prisma.$transaction(async (tx) => {
    // Create Dealer (represents the dealership organization/tenant)
    const dealer = await tx.dealer.create({
      data: {
        name: dealershipName,
        email, // Dealer email must be unique
      },
    });

    // Create DealerUser with DEALER_ADMIN role linked to this Dealer
    const user = await tx.dealerUser.create({
      data: {
        email,
        dealerId: dealer.id,
        passwordHash,
        role: 'DEALER_ADMIN',
      },
    });

    // Initialize onboarding steps for the new dealer
    await tx.onboardingStep.createMany({
      data: ['branding', 'dms', 'staff', 'billing'].map((stepName) => ({
        dealerId: dealer.id,
        stepName,
        status: 'pending',
      })),
      skipDuplicates: true,
    });

    return { dealer, user };
  });
}

/**
 * Find a DealerUser by email across all dealers.
 * Used to check for duplicate email addresses during registration.
 */
export async function findUserByEmail(email: string): Promise<DealerUser | null> {
  return prisma.dealerUser.findFirst({
    where: { email },
  });
}
