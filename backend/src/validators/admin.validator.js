import { z } from 'zod';

const paging = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  role: z.enum(['customer', 'vendor', 'admin']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  ...paging,
});

export const userStatusSchema = z
  .object({
    status: z.enum(['active', 'suspended']),
    reason: z.string().trim().max(300).optional(),
  })
  .refine((b) => b.status !== 'suspended' || b.reason, { message: 'Give a reason for suspending', path: ['reason'] });

export const userRoleSchema = z.object({ role: z.enum(['customer', 'admin']) });

export const listApplicationsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const listProductsAdminQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  owner: z.enum(['house', 'vendor']).optional(),
  visibility: z.enum(['visible', 'hidden', 'low_stock']).optional(),
  ...paging,
});

export const productVisibilitySchema = z
  .object({
    hidden: z.boolean(),
    reason: z.string().trim().max(300).optional(),
  })
  .refine((b) => !b.hidden || b.reason, { message: 'Give a reason for hiding', path: ['reason'] });

export const listAppointmentsAdminQuerySchema = z.object({
  scope: z.enum(['upcoming', 'needs_update', 'past', 'all']).default('upcoming'),
  owner: z.enum(['clinic', 'all']).default('all'),
  ...paging,
});

export const reportsQuerySchema = z.object({
  days: z.coerce.number().int().refine((d) => [7, 30, 90, 365].includes(d), 'days must be 7, 30, 90 or 365').default(30),
});
