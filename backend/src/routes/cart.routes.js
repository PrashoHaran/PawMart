import { Router } from 'express';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cart.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateObjectId } from '../middleware/validate.js';
import { addCartItemSchema, updateCartItemSchema } from '../validators/cart.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', getCart);
router.post('/items', validateBody(addCartItemSchema), addCartItem);
router.patch('/items/:productId', validateObjectId('productId'), validateBody(updateCartItemSchema), updateCartItem);
router.delete('/items/:productId', validateObjectId('productId'), removeCartItem);
router.delete('/', clearCart);

export default router;
