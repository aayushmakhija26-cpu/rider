import { z } from 'zod';

export const onboardingStepSchema = z.object({
  stepName: z.enum(['branding', 'dms', 'staff', 'billing']),
  status: z.enum(['pending', 'active', 'complete', 'skipped']),
  data: z.record(z.any()).optional(),
});

export type OnboardingStepInput = z.infer<typeof onboardingStepSchema>;
