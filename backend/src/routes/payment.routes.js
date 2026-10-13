import { Router } from 'express';
import { getPaymentConfig } from '../controllers/order.controller.js';

const router = Router();

// Public: tells the checkout page which payment methods to offer.
router.get('/config', getPaymentConfig);

export default router;
