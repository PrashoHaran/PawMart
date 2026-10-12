import { Router } from 'express';
import { createOrder, listOrders, getOrder, cancelOrder } from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateObjectId } from '../middleware/validate.js';
import { createOrderSchema } from '../validators/order.validator.js';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createOrderSchema), createOrder);
router.get('/', listOrders);
router.get('/:id', validateObjectId('id'), getOrder);
router.post('/:id/cancel', validateObjectId('id'), cancelOrder);

export default router;
