import { z } from 'zod';

export const createStaffInviteSchema = z.object({
  email: z.string().trim().email('A valid email address is required'),
});

export const acceptStaffInviteSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be 100 characters or less'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must be at least 8 characters')
      .max(100, 'Confirm password must be 100 characters or less'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type CreateStaffInviteInput = z.infer<typeof createStaffInviteSchema>;
export type AcceptStaffInviteInput = z.infer<typeof acceptStaffInviteSchema>;
