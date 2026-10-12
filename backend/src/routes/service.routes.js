import { Router } from 'express';
import { listServices, getAvailability } from '../controllers/service.controller.js';
import { validateQuery, validateObjectId } from '../middleware/validate.js';
import { availabilityQuerySchema } from '../validators/service.validator.js';

const router = Router();

router.get('/', listServices);
router.get('/:id/availability', validateObjectId('id'), validateQuery(availabilityQuerySchema), getAvailability);

export default router;
