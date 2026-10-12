import { Router } from 'express';
import { deleteReview } from '../controllers/review.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';

const router = Router();

router.delete('/:reviewId', requireAuth, validateObjectId('reviewId'), deleteReview);

export default router;
