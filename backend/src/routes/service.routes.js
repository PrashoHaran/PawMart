import { Router } from 'express';
import { listServices } from '../controllers/service.controller.js';

const router = Router();

router.get('/', listServices);

export default router;
