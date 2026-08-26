import { Router } from 'express';
import {
  applyForVendor,
  getMyVendorApplication,
  listPendingVendorApplications,
  approveVendorApplication,
  rejectVendorApplication,
} from '../controllers/vendorApplication.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validateBody, validateObjectId } from '../middleware/validate.js';
import { applyVendorSchema, rejectVendorApplicationSchema } from '../validators/vendorApplication.validator.js';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(applyVendorSchema), applyForVendor);
router.get('/me', getMyVendorApplication);
router.get('/', requireRole('admin'), listPendingVendorApplications);
router.post('/:id/approve', requireRole('admin'), validateObjectId('id'), approveVendorApplication);
router.post(
  '/:id/reject',
  requireRole('admin'),
  validateObjectId('id'),
  validateBody(rejectVendorApplicationSchema),
  rejectVendorApplication
);

export default router;
