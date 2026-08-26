import { Router } from 'express';
import { listMyAppointments, createAppointment } from '../controllers/appointment.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createAppointmentSchema } from '../validators/appointment.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', listMyAppointments);
router.post('/', validateBody(createAppointmentSchema), createAppointment);

export default router;
