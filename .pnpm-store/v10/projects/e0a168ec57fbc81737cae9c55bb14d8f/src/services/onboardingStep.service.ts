import { prisma } from '@/src/lib/db';
import type { OnboardingStep, OnboardingStatus } from '@prisma/client';
import { getSafeColour } from '@/src/lib/contrast';

/**
 * Get all onboarding steps for a dealer
 */
export async function getSteps(dealerId: string): Promise<OnboardingStep[]> {
  return prisma.onboardingStep.findMany({
    where: { dealerId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get a single onboarding step by dealer and step name
 */
export async function getStep(
  dealerId: string,
  stepName: string
): Promise<OnboardingStep | null> {
  return prisma.onboardingStep.findUnique({
    where: { dealerId_stepName: { dealerId, stepName } },
  });
}

/**
 * Update or create an onboarding step (upsert with idempotency)
 * Automatically sets completedAt timestamp when status is 'complete'
 * Automatically sets skippedAt timestamp when status is 'skipped'
 *
 * CRITICAL: When branding step completes, syncs data to Dealer model (AC #1)
 */
export async function updateStep(
  dealerId: string,
  stepName: string,
  status: OnboardingStatus,
  data?: Record<string, unknown>
): Promise<OnboardingStep> {
  // Validate dealerId exists before proceeding
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
  });

  if (!dealer) {
    throw new Error(`Dealer not found: ${dealerId}`);
  }

  const step = await prisma.onboardingStep.upsert({
    where: { dealerId_stepName: { dealerId, stepName } },
    create: {
      dealerId,
      stepName,
      status,
      data: (data as any) ?? null,
      completedAt: status === 'complete' ? new Date() : null,
      skippedAt: status === 'skipped' ? new Date() : null,
    },
    update: {
      status,
      data: (data as any) ?? null,
      completedAt: status === 'complete' ? new Date() : null,
      skippedAt: status === 'skipped' ? new Date() : null,
    },
  });

  // SYNC branding data to Dealer model when step is marked complete (Story 2.3, AC #1)
  if (stepName === 'branding' && status === 'complete' && data) {
    const brandingData = data as Record<string, unknown>;

    // Build update payload with validation
    const updatePayload: Record<string, unknown> = {};

    // Logo URL: trim empty strings, validate basic URL format
    if (brandingData.logoUrl) {
      const logoUrl = String(brandingData.logoUrl).trim();
      if (logoUrl && /^https?:\/\/.+/.test(logoUrl)) {
        updatePayload.logoUrl = logoUrl;
      }
    }

    // Primary colour: validate hex format and apply WCAG fallback
    if (brandingData.primaryColour) {
      const colour = String(brandingData.primaryColour).trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(colour)) {
        updatePayload.primaryColour = getSafeColour(colour);
      }
    }

    // Contact phone: trim empty strings
    if (brandingData.contactPhone) {
      const phone = String(brandingData.contactPhone).trim();
      if (phone) {
        updatePayload.contactPhone = phone;
      }
    }

    // Contact email: trim and validate basic format
    if (brandingData.contactEmail) {
      const email = String(brandingData.contactEmail).trim();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        updatePayload.contactEmail = email;
      }
    }

    // Website URL: trim empty strings, validate basic URL format
    if (brandingData.websiteUrl) {
      const url = String(brandingData.websiteUrl).trim();
      if (url && /^https?:\/\/.+/.test(url)) {
        updatePayload.websiteUrl = url;
      }
    }

    // Only update if we have valid data
    if (Object.keys(updatePayload).length > 0) {
      await prisma.dealer.update({
        where: { id: dealerId },
        data: updatePayload,
      });
    }
  }

  return step;
}

/**
 * Check if all required onboarding steps are complete
 */
export async function allStepsComplete(dealerId: string): Promise<boolean> {
  const steps = await prisma.onboardingStep.findMany({
    where: { dealerId },
  });

  const requiredSteps = ['branding', 'dms', 'staff', 'billing'];
  return requiredSteps.every((step) =>
    steps.some((s) => s.stepName === step && s.status === 'complete')
  );
}
