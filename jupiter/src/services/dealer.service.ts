import { prisma } from '@/src/lib/db';
import type { Dealer, DealerUser } from '@prisma/client';
import { getSafeColour } from '@/src/lib/contrast';

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

/**
 * Update dealer branding configuration (Story 2.3)
 * Validates all inputs and applies WCAG fallback for colour
 */
export async function updateBranding(
  dealerId: string,
  logoUrl?: string,
  primaryColour?: string,
  contactPhone?: string,
  contactEmail?: string,
  websiteUrl?: string
): Promise<Dealer> {
  // Validate dealerId exists
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
  });

  if (!dealer) {
    throw new Error(`Dealer not found: ${dealerId}`);
  }

  const data: Record<string, unknown> = {};

  // Validate and add logoUrl
  if (logoUrl) {
    const trimmed = logoUrl.trim();
    if (trimmed && /^https?:\/\/.+/.test(trimmed)) {
      data.logoUrl = trimmed;
    }
  }

  // Validate and add primaryColour with WCAG fallback
  if (primaryColour) {
    const trimmed = primaryColour.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
      data.primaryColour = getSafeColour(trimmed);
    }
  }

  // Validate and add contactPhone
  if (contactPhone) {
    const trimmed = contactPhone.trim();
    if (trimmed) {
      data.contactPhone = trimmed;
    }
  }

  // Validate and add contactEmail
  if (contactEmail) {
    const trimmed = contactEmail.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      data.contactEmail = trimmed;
    }
  }

  // Validate and add websiteUrl
  if (websiteUrl) {
    const trimmed = websiteUrl.trim();
    if (trimmed && /^https?:\/\/.+/.test(trimmed)) {
      data.websiteUrl = trimmed;
    }
  }

  // Only update if we have valid data
  if (Object.keys(data).length === 0) {
    return dealer;
  }

  return prisma.dealer.update({
    where: { id: dealerId },
    data,
  });
}

/**
 * Find a Dealer by Stripe customer ID. (Story 2.6)
 * Used by the webhook handler to locate the dealer for a given Stripe customer.
 */
export async function getDealerByStripeCustomerId(customerId: string): Promise<Dealer | null> {
  return prisma.dealer.findUnique({
    where: { stripeCustomerId: customerId },
  });
}

/**
 * Update billing fields on a Dealer record. (Story 2.6)
 * Idempotent: calling with the same values produces the same state (plain update).
 */
export async function updateDealerStripeSubscription(
  dealerId: string,
  data: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeProductId?: string | null;
    planName?: string | null;
    subscriptionStatus?: string | null;
  }
): Promise<Dealer> {
  return prisma.dealer.update({
    where: { id: dealerId },
    data,
  });
}

/**
 * Get dealer branding configuration (Story 2.3)
 * Returns only branding-related fields for preview/display
 * Throws error if dealer not found
 */
export async function getBranding(dealerId: string) {
  const branding = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: {
      logoUrl: true,
      primaryColour: true,
      contactPhone: true,
      contactEmail: true,
      websiteUrl: true,
    },
  });

  if (!branding) {
    throw new Error(`Dealer not found: ${dealerId}`);
  }

  return branding;
}
