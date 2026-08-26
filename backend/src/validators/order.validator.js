import { z } from 'zod';

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    address: z.string().trim().min(1).max(255),
    city: z.string().trim().min(1).max(100),
    postalCode: z.string().trim().min(1).max(20),
  }),
  paymentMethod: z.enum(['credit_card', 'cash_on_delivery']),
});
