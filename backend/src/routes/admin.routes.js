import { Router } from 'express';
import { getAdminStats } from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', getAdminStats);

export default router;
