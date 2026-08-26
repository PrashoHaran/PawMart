import { z } from 'zod';

export const petAssistantRecommendSchema = z.object({
  petType: z.enum(['dog', 'cat']),
  breed: z.string().trim().max(100).optional(),
  ageYears: z.coerce.number().min(0).max(40),
  weightKg: z.coerce.number().positive().max(150),
  activityLevel: z.enum(['Low', 'Moderate', 'High']),
  allergies: z.string().trim().max(500).optional(),
});
