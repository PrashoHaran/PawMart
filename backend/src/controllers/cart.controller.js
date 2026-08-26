import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
}

async function serializeCart(cart) {
  const populated = await cart.populate('items.product', 'name image priceCents stock');
  const items = populated.items
    .filter((item) => item.product) // drop items whose product was deleted
    .map((item) => ({
      product: item.product,
      quantity: item.quantity,
      lineTotalCents: item.product.priceCents * item.quantity,
    }));
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  return { items, subtotalCents };
}

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  sendData(res, 200, await serializeCart(cart));
});

export const addCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((item) => item.product.toString() === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }
  await cart.save();

  sendData(res, 200, await serializeCart(cart));
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    throw ApiError.notFound('Item not in cart');
  }
  item.quantity = quantity;
  await cart.save();

  sendData(res, 200, await serializeCart(cart));
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();

  sendData(res, 200, await serializeCart(cart));
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();

  sendData(res, 200, await serializeCart(cart));
});
