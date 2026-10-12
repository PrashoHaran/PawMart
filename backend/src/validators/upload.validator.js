import { z } from 'zod';

export const createSignatureSchema = z.object({
  purpose: z.enum(['product', 'pet']),
});
