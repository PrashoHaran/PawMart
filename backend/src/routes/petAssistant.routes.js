import { Router } from 'express';
import { getRecommendation, getBreeds } from '../controllers/petAssistant.controller.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { petAssistantRecommendSchema, breedsQuerySchema } from '../validators/petAssistant.validator.js';

const router = Router();

router.get('/breeds', validateQuery(breedsQuerySchema), getBreeds);
router.post('/recommend', validateBody(petAssistantRecommendSchema), getRecommendation);

export default router;
