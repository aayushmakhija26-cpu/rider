'use server';

import { updateStep } from '@/src/services/onboardingStep.service';
import { onboardingStepSchema } from '@/src/schemas/onboarding';
import { getSession, AuthError } from '@/lib/auth/session';
import type { OnboardingStatus } from '@prisma/client';

export async function updateOnboardingStep(
  stepName: string,
  status: string,
  data?: Record<string, unknown>
) {
  try {
    // Get session and verify authentication
    const session = await getSession();
    if (!session) {
      throw new AuthError('UNAUTHORIZED', 'No session found');
    }

    // Verify DEALER_ADMIN role
    if (session.role !== 'DEALER_ADMIN') {
      throw new AuthError('FORBIDDEN', 'Only DEALER_ADMIN can update steps');
    }

    // Validate input
    const validated = onboardingStepSchema.parse({
      stepName,
      status,
      data,
    });

    // Update in database
    const step = await updateStep(
      session.dealerId,
      validated.stepName,
      validated.status as OnboardingStatus,
      validated.data
    );

    return { success: true, step };
  } catch (error) {
    if (error instanceof AuthError) {
      throw new Error(`${error.code}: ${error.message}`);
    }
    throw error;
  }
}
