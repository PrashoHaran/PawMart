import { Router } from 'express';
import {
  createOrder,
  listOrders,
  getOrder,
  cancelOrder,
  startPayPalCheckout,
  capturePayPalCheckout,
  cancelPayPalCheckout,
} from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateObjectId } from '../middleware/validate.js';
import { createOrderSchema, startPayPalSchema } from '../validators/order.validator.js';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createOrderSchema), createOrder);
router.post('/paypal', validateBody(startPayPalSchema), startPayPalCheckout);
router.post('/paypal/:paypalOrderId/capture', capturePayPalCheckout);
router.post('/paypal/:paypalOrderId/cancel', cancelPayPalCheckout);
router.get('/', listOrders);
router.get('/:id', validateObjectId('id'), getOrder);
router.post('/:id/cancel', validateObjectId('id'), cancelOrder);

export default router;
