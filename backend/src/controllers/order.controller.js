import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { sendMail } from '../services/mailer.js';
import { orderConfirmationEmail } from '../services/emailTemplates.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
const FLAT_SHIPPING_CENTS = 599;
const TAX_RATE = 0.08;

export const createOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate(
    'items.product',
    'name priceCents stock'
  );

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  // Atomically decrement stock per item; roll back any already-decremented
  // items in this request if a later item is out of stock.
  const decremented = [];
  for (const item of cart.items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product._id, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );

    if (!updated) {
      await Promise.all(
        decremented.map(({ productId, quantity }) =>
          Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })
        )
      );
      throw ApiError.conflict(`Insufficient stock for "${item.product.name}"`, [
        { field: 'items', productId: item.product._id.toString() },
      ]);
    }

    decremented.push({ productId: item.product._id, quantity: item.quantity });
  }

  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    priceCents: item.product.priceCents,
    quantity: item.quantity,
  }));

  const subtotalCents = orderItems.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const shippingCents = subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + shippingCents + taxCents;

  const order = await Order.create({
    userId: req.user._id,
    items: orderItems,
    subtotalCents,
    taxCents,
    shippingCents,
    totalCents,
    shippingAddress: req.body.shippingAddress,
    paymentMethod: req.body.paymentMethod,
  });

  cart.items = [];
  await cart.save();

  sendData(res, 201, order);

  // Fire-and-forget: the order is already placed, so don't make the client wait on SMTP.
  sendMail({ to: req.user.email, ...orderConfirmationEmail(req.user, order) });
});

export const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  sendData(res, 200, orders);
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  sendData(res, 200, order);
});
