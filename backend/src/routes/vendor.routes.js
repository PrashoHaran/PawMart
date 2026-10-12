import { Router } from 'express';
import {
  listMyProducts,
  createMyProduct,
  updateMyProduct,
  deleteMyProduct,
  getMyVendorStats,
  listMyOrders,
  updateMyOrderStatus,
} from '../controllers/vendor.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validateBody, validateQuery, validateObjectId } from '../middleware/validate.js';
import { createVendorProductSchema, updateVendorProductSchema } from '../validators/vendor.validator.js';
import { listOrdersQuerySchema, updateOrderStatusSchema } from '../validators/order.validator.js';

const router = Router();

router.use(requireAuth, requireRole('vendor'));

router.get('/stats', getMyVendorStats);
router.get('/products', listMyProducts);
router.post('/products', validateBody(createVendorProductSchema), createMyProduct);
router.patch(
  '/products/:id',
  validateObjectId('id'),
  validateBody(updateVendorProductSchema),
  updateMyProduct
);
router.delete('/products/:id', validateObjectId('id'), deleteMyProduct);
router.get('/orders', validateQuery(listOrdersQuerySchema), listMyOrders);
router.patch('/orders/:id/status', validateObjectId('id'), validateBody(updateOrderStatusSchema), updateMyOrderStatus);

export default router;
