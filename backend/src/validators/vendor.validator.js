import { z } from 'zod';

export const createVendorProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  priceCents: z.coerce.number().int().min(0),
  category: z.string().trim().min(1).max(100),
  image: z.string().trim().url(),
  description: z.string().trim().max(2000).optional(),
  features: z.array(z.string().trim().max(200)).optional(),
  stock: z.coerce.number().int().min(0),
});

export const updateVendorProductSchema = createVendorProductSchema.partial();
