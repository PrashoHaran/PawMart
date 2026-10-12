import { Router } from 'express';
import {
  listMyServices,
  createMyService,
  updateMyService,
  deleteMyService,
  listMyAppointments,
  updateMyAppointmentStatus,
  getMyProviderStats,
} from '../controllers/provider.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireServiceProvider } from '../middleware/role.js';
import { validateBody, validateQuery, validateObjectId } from '../middleware/validate.js';
import {
  createServiceSchema,
  updateServiceSchema,
  providerAppointmentStatusSchema,
  providerAppointmentsQuerySchema,
} from '../validators/service.validator.js';

const router = Router();

router.use(requireAuth, requireServiceProvider);

router.get('/stats', getMyProviderStats);
router.get('/services', listMyServices);
router.post('/services', validateBody(createServiceSchema), createMyService);
router.patch('/services/:id', validateObjectId('id'), validateBody(updateServiceSchema), updateMyService);
router.delete('/services/:id', validateObjectId('id'), deleteMyService);
router.get('/appointments', validateQuery(providerAppointmentsQuerySchema), listMyAppointments);
router.patch(
  '/appointments/:id/status',
  validateObjectId('id'),
  validateBody(providerAppointmentStatusSchema),
  updateMyAppointmentStatus
);

export default router;
