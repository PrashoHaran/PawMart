import { Router } from 'express';
import { getRecommendation } from '../controllers/petAssistant.controller.js';
import { validateBody } from '../middleware/validate.js';
import { petAssistantRecommendSchema } from '../validators/petAssistant.validator.js';

const router = Router();

router.post('/recommend', validateBody(petAssistantRecommendSchema), getRecommendation);

export default router;
