import { prisma } from '@/src/lib/db';
import type { OnboardingStep, OnboardingStatus } from '@prisma/client';

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
 */
export async function updateStep(
  dealerId: string,
  stepName: string,
  status: OnboardingStatus,
  data?: Record<string, unknown>
): Promise<OnboardingStep> {
  return prisma.onboardingStep.upsert({
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
