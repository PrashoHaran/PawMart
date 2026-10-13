import { Router } from 'express';
import { register, login, me, googleLogin, authConfig } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema, googleLoginSchema } from '../validators/auth.validator.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.get('/me', requireAuth, me);
router.get('/config', authConfig);
router.post('/google', authLimiter, validateBody(googleLoginSchema), googleLogin);

export default router;
