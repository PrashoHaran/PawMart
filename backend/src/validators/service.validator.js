import { z } from 'zod';
import { SLOT_LABEL_PATTERN } from '../utils/appointmentTime.js';

export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

const slotLabel = z
  .string()
  .trim()
  .regex(SLOT_LABEL_PATTERN, 'Time slots look like "09:00 AM"')
  .transform((label) => {
    const [, h, m, mer] = label.match(SLOT_LABEL_PATTERN);
    return `${h.padStart(2, '0')}:${m} ${mer.toUpperCase()}`;
  });

export const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  type: z.enum(['vet', 'grooming']),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  priceCents: z.coerce.number().int().min(0).max(10_000_000),
  timeSlots: z
    .array(slotLabel)
    .min(1, 'Add at least one time slot')
    .max(24)
    .refine((slots) => new Set(slots).size === slots.length, 'Time slots must be unique'),
  availableDays: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Pick at least one day')
    .transform((days) => [...new Set(days)].sort()),
  active: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const providerAppointmentStatusSchema = z
  .object({
    status: z.enum(['completed', 'no_show', 'cancelled']),
    reason: z.string().trim().max(300).optional(),
  })
  .refine((body) => body.status !== 'cancelled' || body.reason, {
    message: 'Please give the customer a reason for cancelling',
    path: ['reason'],
  });

export const providerAppointmentsQuerySchema = z.object({
  scope: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
