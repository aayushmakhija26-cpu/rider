import { z } from 'zod';

const dealerRegistrationSchemaBase = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirm: z.string(),
  dealershipName: z.string().trim().min(1, 'Dealership name is required').max(255),
});

export const dealerRegistrationSchema = dealerRegistrationSchemaBase.refine(
  (data) => data.password === data.passwordConfirm,
  { message: 'Passwords do not match', path: ['passwordConfirm'] }
);

export type DealerRegistrationInput = Omit<
  z.infer<typeof dealerRegistrationSchemaBase>,
  'passwordConfirm'
>;