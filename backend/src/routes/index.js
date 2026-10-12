import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import vendorApplicationRoutes from './vendorApplication.routes.js';
import adminRoutes from './admin.routes.js';
import vendorRoutes from './vendor.routes.js';
import serviceRoutes from './service.routes.js';
import appointmentRoutes from './appointment.routes.js';
import petAssistantRoutes from './petAssistant.routes.js';
import reviewRoutes from './review.routes.js';
import petRoutes from './pet.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/vendor-applications', vendorApplicationRoutes);
router.use('/admin', adminRoutes);
router.use('/vendor', vendorRoutes);
router.use('/services', serviceRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/pet-assistant', petAssistantRoutes);
router.use('/reviews', reviewRoutes);
router.use('/pets', petRoutes);
router.use('/uploads', uploadRoutes);

export default router;
