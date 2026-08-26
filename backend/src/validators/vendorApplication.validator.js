import { z } from 'zod';

export const applyVendorSchema = z.object({
  businessName: z.string().trim().min(1).max(150),
  businessType: z.enum(['service_provider', 'retail_vendor']),
});

export const rejectVendorApplicationSchema = z.object({
  rejectionReason: z.string().trim().max(500).optional(),
});
