import { Router } from 'express';
import {
  getAdminStats,
  runRemindersNow,
  listAllOrders,
  updateOrderStatus,
} from '../controllers/admin.controller.js';
import { validateBody, validateQuery, validateObjectId } from '../middleware/validate.js';
import { listOrdersQuerySchema, updateOrderStatusSchema } from '../validators/order.validator.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', getAdminStats);
router.post('/reminders/vaccinations/run', runRemindersNow);
router.get('/orders', validateQuery(listOrdersQuerySchema), listAllOrders);
router.patch('/orders/:id/status', validateObjectId('id'), validateBody(updateOrderStatusSchema), updateOrderStatus);

export default router;
