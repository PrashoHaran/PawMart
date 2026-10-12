import { Router } from 'express';
import { getUploadConfig, createSignature } from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createSignatureSchema } from '../validators/upload.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/config', getUploadConfig);
router.post('/signature', validateBody(createSignatureSchema), createSignature);

export default router;
