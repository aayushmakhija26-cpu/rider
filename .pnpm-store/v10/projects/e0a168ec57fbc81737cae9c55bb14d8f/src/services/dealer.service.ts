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
  try {
    console.log('[dealer.service] createDealerWithAdmin called for:', email, dealershipName);
    const result = await prisma.$transaction(async (tx) => {
      console.log('[dealer.service] Starting transaction...');

      // Create Dealer (represents the dealership organization/tenant)
      console.log('[dealer.service] Creating dealer...');
      const dealer = await tx.dealer.create({
        data: {
          name: dealershipName,
          email, // Dealer email must be unique
        },
      });
      console.log('[dealer.service] Dealer created:', dealer.id);

      // Create DealerUser with DEALER_ADMIN role linked to this Dealer
      console.log('[dealer.service] Creating dealer user...');
      const user = await tx.dealerUser.create({
        data: {
          email,
          dealerId: dealer.id,
          passwordHash,
          role: 'DEALER_ADMIN',
        },
      });
      console.log('[dealer.service] User created:', user.id);

      // Initialize onboarding steps for the new dealer
      console.log('[dealer.service] Creating onboarding steps...');
      await tx.onboardingStep.createMany({
        data: ['branding', 'dms', 'staff', 'billing'].map((stepName) => ({
          dealerId: dealer.id,
          stepName,
          status: 'pending',
        })),
        skipDuplicates: true,
      });
      console.log('[dealer.service] Onboarding steps created');

      return { dealer, user };
    });
    console.log('[dealer.service] Transaction completed successfully');
    return result;
  } catch (error) {
    console.error('[dealer.service] createDealerWithAdmin error:', error);
    throw error;
  }
}

/**
 * Find a DealerUser by email across all dealers.
 * Used to check for duplicate email addresses during registration.
 */
export async function findUserByEmail(email: string): Promise<DealerUser | null> {
  try {
    console.log('[dealer.service] findUserByEmail called for:', email);
    const result = await prisma.dealerUser.findFirst({
      where: { email },
    });
    console.log('[dealer.service] findUserByEmail result:', result ? 'found' : 'not found');
    return result;
  } catch (error) {
    console.error('[dealer.service] findUserByEmail error:', error);
    throw error;
  }
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
 * Get dealer profile for settings page (Story 2.7)
 * Returns all editable profile fields
 * Throws if dealer not found
 */
export async function getDealerProfile(dealerId: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      primaryColour: true,
      contactPhone: true,
      contactEmail: true,
      websiteUrl: true,
    },
  });

  if (!dealer) {
    throw new Error(`Dealer not found: ${dealerId}`);
  }

  return dealer;
}

/**
 * Update dealer profile fields (Story 2.7)
 * Validates dealer exists, applies WCAG fallback for colour, updates record
 * Idempotent: calling twice with same data produces same result
 */
export async function updateDealerProfile(
  dealerId: string,
  data: {
    name?: string;
    logoUrl?: string;
    primaryColour?: string;
    contactPhone?: string;
    contactEmail?: string;
    websiteUrl?: string;
  }
): Promise<Dealer> {
  const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
  if (!dealer) throw new Error(`Dealer not found: ${dealerId}`);

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    if (data.name.length > 0) {
      updateData.name = data.name;
    }
  }
  if (data.logoUrl !== undefined) {
    updateData.logoUrl = data.logoUrl || null;
  }
  if (data.primaryColour !== undefined) {
    updateData.primaryColour = data.primaryColour ? getSafeColour(data.primaryColour) : null;
  }
  if (data.contactPhone !== undefined) {
    updateData.contactPhone = data.contactPhone || null;
  }
  if (data.contactEmail !== undefined) {
    updateData.contactEmail = data.contactEmail || null;
  }
  if (data.websiteUrl !== undefined) {
    updateData.websiteUrl = data.websiteUrl || null;
  }

  if (Object.keys(updateData).length === 0) {
    return dealer;
  }

  return prisma.dealer.update({ where: { id: dealerId }, data: updateData });
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
