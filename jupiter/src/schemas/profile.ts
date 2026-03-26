import { z } from 'zod';
import { brandingSchema } from './branding';

export const profileSchema = brandingSchema.extend({
  name: z.string().min(1).max(100).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
