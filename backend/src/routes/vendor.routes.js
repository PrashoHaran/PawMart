import { Router } from 'express';
import {
  listMyProducts,
  createMyProduct,
  updateMyProduct,
  deleteMyProduct,
  getMyVendorStats,
} from '../controllers/vendor.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validateBody, validateObjectId } from '../middleware/validate.js';
import { createVendorProductSchema, updateVendorProductSchema } from '../validators/vendor.validator.js';

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

export default router;
