import { z } from 'zod';
import { PET_SPECIES } from '../models/Pet.js';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const optionalDate = dateString.nullable().optional();
const stringList = z.array(z.string().trim().min(1).max(100)).max(30);

export const createPetSchema = z.object({
  name: z.string().trim().min(1).max(60),
  species: z.enum(PET_SPECIES),
  breed: z.string().trim().max(100).optional(),
  sex: z.enum(['male', 'female', 'unknown']).optional(),
  birthDate: optionalDate,
  weightKg: z.coerce.number().min(0).max(500).nullable().optional(),
  allergies: stringList.optional(),
  photoUrl: z.union([z.string().trim().url(), z.literal('')]).optional(),
});

export const updatePetSchema = createPetSchema.partial();

export const updateHealthRecordSchema = z.object({
  conditions: stringList.optional(),
  medicalNotes: z.string().trim().max(2000).optional(),
});

export const vaccinationSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    dateGiven: dateString,
    nextDueDate: optionalDate,
    vetName: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((v) => !v.nextDueDate || v.nextDueDate > v.dateGiven, {
    message: 'Next due date must be after the date given',
    path: ['nextDueDate'],
  });
