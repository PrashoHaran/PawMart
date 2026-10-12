import { Router } from 'express';
import { listProducts, getProduct } from '../controllers/product.controller.js';
import {
  listReviews,
  getReviewEligibility,
  createReview,
} from '../controllers/review.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validateBody, validateQuery, validateObjectId } from '../middleware/validate.js';
import { listProductsQuerySchema } from '../validators/product.validator.js';
import { createReviewSchema, listReviewsQuerySchema } from '../validators/review.validator.js';

const router = Router();

router.get('/', validateQuery(listProductsQuerySchema), listProducts);
router.get('/:id', validateObjectId('id'), getProduct);

router.get('/:id/reviews', validateObjectId('id'), validateQuery(listReviewsQuerySchema), listReviews);
router.get('/:id/reviews/eligibility', requireAuth, validateObjectId('id'), getReviewEligibility);
router.post(
  '/:id/reviews',
  requireAuth,
  requireRole('customer'),
  validateObjectId('id'),
  validateBody(createReviewSchema),
  createReview
);

export default router;
