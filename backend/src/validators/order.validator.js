import { z } from 'zod';

const shippingAddressSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(255),
  city: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(20),
});

export const startPayPalSchema = z.object({ shippingAddress: shippingAddressSchema });

export const createOrderSchema = z
  .object({
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.enum(['credit_card', 'cash_on_delivery']),
    card: z
      .object({
        number: z.string().trim().max(30),
        expiry: z.string().trim().max(7),
        cvc: z.string().trim().max(4),
      })
      .optional(),
  })
  .refine((body) => body.paymentMethod !== 'credit_card' || body.card, {
    message: 'Card details are required for card payments',
    path: ['card'],
  })
  // Never keep card details around for cash-on-delivery orders.
  .transform((body) => (body.paymentMethod === 'credit_card' ? body : { ...body, card: undefined }));

const statusSchema = z.enum(['processing', 'shipped', 'delivered', 'cancelled']);

export const updateOrderStatusSchema = z.object({ status: statusSchema });

export const listOrdersQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
