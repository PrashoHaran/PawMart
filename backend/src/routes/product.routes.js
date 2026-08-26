import { Router } from 'express';
import { listProducts, getProduct } from '../controllers/product.controller.js';
import { validateQuery, validateObjectId } from '../middleware/validate.js';
import { listProductsQuerySchema } from '../validators/product.validator.js';

const router = Router();

router.get('/', validateQuery(listProductsQuerySchema), listProducts);
router.get('/:id', validateObjectId('id'), getProduct);

export default router;
