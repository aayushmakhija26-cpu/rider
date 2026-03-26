import { z } from 'zod';

export const brandingSchema = z.object({
  logoUrl: z
    .string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),
  primaryColour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour format (e.g., #2563EB)')
    .optional()
    .or(z.literal('')),
  contactPhone: z
    .string()
    .max(20, 'Phone must be 20 characters or less')
    .optional()
    .or(z.literal('')),
  contactEmail: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  websiteUrl: z
    .string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),
});

export type BrandingInput = z.infer<typeof brandingSchema>;
