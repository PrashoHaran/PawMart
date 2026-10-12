import { Router } from 'express';
import {
  getAdminStats,
  runRemindersNow,
  listAllOrders,
  updateOrderStatus,
  getReports,
} from '../controllers/admin.controller.js';
import {
  listUsers,
  updateUserStatus,
  updateUserRole,
  listApplications,
  listAllProducts,
  setProductVisibility,
  createHouseProduct,
  updateHouseProduct,
  deleteHouseProduct,
  listAllAppointments,
  updateAppointmentStatus,
} from '../controllers/adminManage.controller.js';
import {
  listUsersQuerySchema,
  userStatusSchema,
  userRoleSchema,
  listApplicationsQuerySchema,
  listProductsAdminQuerySchema,
  productVisibilitySchema,
  listAppointmentsAdminQuerySchema,
  reportsQuerySchema,
} from '../validators/admin.validator.js';
import { createVendorProductSchema, updateVendorProductSchema } from '../validators/vendor.validator.js';
import { providerAppointmentStatusSchema } from '../validators/service.validator.js';
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

router.get('/reports', validateQuery(reportsQuerySchema), getReports);

router.get('/users', validateQuery(listUsersQuerySchema), listUsers);
router.patch('/users/:id/status', validateObjectId('id'), validateBody(userStatusSchema), updateUserStatus);
router.patch('/users/:id/role', validateObjectId('id'), validateBody(userRoleSchema), updateUserRole);

router.get('/vendor-applications', validateQuery(listApplicationsQuerySchema), listApplications);

router.get('/products', validateQuery(listProductsAdminQuerySchema), listAllProducts);
router.post('/products', validateBody(createVendorProductSchema), createHouseProduct);
router.patch('/products/:id', validateObjectId('id'), validateBody(updateVendorProductSchema), updateHouseProduct);
router.delete('/products/:id', validateObjectId('id'), deleteHouseProduct);
router.patch('/products/:id/visibility', validateObjectId('id'), validateBody(productVisibilitySchema), setProductVisibility);

router.get('/appointments', validateQuery(listAppointmentsAdminQuerySchema), listAllAppointments);
router.patch('/appointments/:id/status', validateObjectId('id'), validateBody(providerAppointmentStatusSchema), updateAppointmentStatus);

export default router;
