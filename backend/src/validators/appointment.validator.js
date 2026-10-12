import { z } from 'zod';

export const createAppointmentSchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  timeSlotLabel: z.string().regex(/^\d{1,2}:\d{2}\s?(AM|PM)$/i, 'Invalid time slot'),
  petId: z.string().min(1).optional(),
  petDescription: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(1000).optional(),
});
