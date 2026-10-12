import { Router } from 'express';
import {
  listMyAppointments,
  createAppointment,
  cancelAppointment,
} from '../controllers/appointment.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateObjectId } from '../middleware/validate.js';
import { createAppointmentSchema } from '../validators/appointment.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', listMyAppointments);
router.post('/', validateBody(createAppointmentSchema), createAppointment);
router.patch('/:id/cancel', validateObjectId('id'), cancelAppointment);

export default router;
