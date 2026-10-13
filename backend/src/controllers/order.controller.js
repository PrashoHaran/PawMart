import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { sendMail } from '../services/mailer.js';
import { orderConfirmationEmail } from '../services/emailTemplates.js';
import { cardSummary, charge, validateCard } from '../services/paymentGateway.js';
import { cancelOrder as cancelOrderService, withPayments } from '../services/orderFulfilment.js';
import { capturePayPalOrder, createPayPalOrder, isPayPalConfigured, paypalPublicConfig } from '../services/paypal.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicProductFilter } from '../utils/visibility.js';

const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
const FLAT_SHIPPING_CENTS = 599;
const TAX_RATE = 0.08;

function restock(decremented) {
  return Promise.all(
    decremented.map(({ productId, quantity }) =>
      Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })
    )
  );
}

// Checks the cart, reserves stock atomically and prices the order. Throws
// (with nothing reserved) if the cart is empty, an item is unavailable or
// stock runs out. Callers must release `reserved` if they fail later.
async function reserveCart(userId) {
  const cart = await Cart.findOne({ userId }).populate('items.product', 'name priceCents stock vendorId');

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  const available = new Set(
    (await Product.find({ _id: { $in: cart.items.map((i) => i.product._id) }, ...(await publicProductFilter()) }).distinct('_id')).map(String)
  );
  const unavailable = cart.items.filter((i) => !available.has(String(i.product._id)));
  if (unavailable.length) {
    throw ApiError.conflict(
      `No longer available: ${unavailable.map((i) => i.product.name).join(', ')}. Remove ${unavailable.length === 1 ? 'it' : 'them'} from your cart to continue.`,
      unavailable.map((i) => ({ field: 'items', productId: String(i.product._id) }))
    );
  }

  // Atomically decrement stock per item; roll back any already-decremented
  // items in this request if a later item is out of stock.
  const reserved = [];
  for (const item of cart.items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product._id, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );

    if (!updated) {
      await restock(reserved);
      throw ApiError.conflict(`Insufficient stock for "${item.product.name}"`, [
        { field: 'items', productId: item.product._id.toString() },
      ]);
    }

    reserved.push({ productId: item.product._id, quantity: item.quantity });
  }

  const items = cart.items.map((item) => ({
    product: item.product._id,
    vendorId: item.product.vendorId || null,
    name: item.product.name,
    priceCents: item.product.priceCents,
    quantity: item.quantity,
  }));

  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const shippingCents = subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + shippingCents + taxCents;

  return { cart, items, reserved, subtotalCents, shippingCents, taxCents, totalCents };
}

export const createOrder = asyncHandler(async (req, res) => {
  const { paymentMethod, card, shippingAddress } = req.body;

  if (paymentMethod === 'paypal') {
    throw ApiError.badRequest('PayPal payments start from POST /api/orders/paypal');
  }

  // Reject malformed card details before touching stock.
  if (paymentMethod === 'credit_card') {
    const problems = validateCard(card);
    if (problems.length) {
      throw ApiError.badRequest('Invalid card details', problems);
    }
  }

  const { cart, items, reserved, subtotalCents, shippingCents, taxCents, totalCents } = await reserveCart(req.user._id);

  // Simulated card charge. On decline: restock, keep the cart, record the
  // failed attempt, and let the customer retry with corrected details.
  let paymentFields;
  if (paymentMethod === 'credit_card') {
    const result = charge(card);
    if (!result.ok) {
      await restock(reserved);
      await Payment.create({
        userId: req.user._id,
        method: 'credit_card',
        amountCents: totalCents,
        status: 'failed',
        card: cardSummary(card),
        failureCode: result.code,
        failureMessage: result.message,
      });
      throw new ApiError(402, 'PAYMENT_DECLINED', result.message, [{ field: 'card', code: result.code }]);
    }
    paymentFields = {
      status: 'succeeded',
      card: cardSummary(card),
      transactionRef: result.transactionRef,
      paidAt: new Date(),
    };
  } else {
    // Cash on delivery is collected when the order is delivered.
    paymentFields = { status: 'pending' };
  }

  const order = await Order.create({
    userId: req.user._id,
    items,
    subtotalCents,
    taxCents,
    shippingCents,
    totalCents,
    statusHistory: [{ status: 'confirmed', byRole: 'customer' }],
    shippingAddress,
    paymentMethod,
  });

  const payment = await Payment.create({
    userId: req.user._id,
    orderId: order._id,
    method: paymentMethod,
    amountCents: totalCents,
    ...paymentFields,
  });
  order.paymentId = payment._id;
  await order.save();

  cart.items = [];
  await cart.save();

  const [data] = await withPayments([order.toObject()]);
  sendData(res, 201, data);

  // Fire-and-forget: the order is already placed, so don't make the client wait on SMTP.
  sendMail({ to: req.user.email, ...orderConfirmationEmail(req.user, order) });
});

// ---------- PayPal Checkout
//
// 1. POST /orders/paypal          reserve stock, create a pending order and a PayPal order
// 2. (buyer approves in the PayPal popup)
// 3. POST /orders/paypal/:id/capture   capture the money, confirm the order, clear the cart
//    POST /orders/paypal/:id/cancel    buyer closed the popup: release stock
// Pending orders nobody completes are released by the cleanup job.

export const startPayPalCheckout = asyncHandler(async (req, res) => {
  if (!isPayPalConfigured()) {
    throw new ApiError(503, 'PAYPAL_DISABLED', 'PayPal is not configured on this server');
  }

  const { items, reserved, subtotalCents, shippingCents, taxCents, totalCents } = await reserveCart(req.user._id);

  const order = await Order.create({
    userId: req.user._id,
    items,
    subtotalCents,
    taxCents,
    shippingCents,
    totalCents,
    status: 'pending',
    statusHistory: [{ status: 'pending', byRole: 'customer' }],
    shippingAddress: req.body.shippingAddress,
    paymentMethod: 'paypal',
  });

  let paypalOrderId;
  try {
    paypalOrderId = await createPayPalOrder({
      referenceId: order._id.toString(),
      amountCents: totalCents,
      description: `PawMart order #${order._id.toString().slice(-6).toUpperCase()}`,
      shippingAddress: req.body.shippingAddress,
    });
  } catch (err) {
    await restock(reserved);
    await order.deleteOne();
    throw err;
  }

  const payment = await Payment.create({
    userId: req.user._id,
    orderId: order._id,
    method: 'paypal',
    amountCents: totalCents,
    status: 'pending',
    providerOrderId: paypalOrderId,
  });
  order.paymentId = payment._id;
  await order.save();

  sendData(res, 201, { orderId: order._id, paypalOrderId, totalCents });
});

async function findPendingPayPal(req) {
  const payment = await Payment.findOne({ providerOrderId: req.params.paypalOrderId, userId: req.user._id, method: 'paypal' });
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }
  const order = await Order.findById(payment.orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  return { payment, order };
}

// Marks a pending PayPal order as paid. Shared by capture and the cleanup job.
export async function confirmPayPalOrder(order, payment, result) {
  payment.status = 'succeeded';
  payment.transactionRef = result.captureId;
  payment.payerEmail = result.payerEmail;
  payment.paidAt = new Date();
  await payment.save();

  order.status = 'confirmed';
  order.statusHistory.push({ status: 'confirmed', byRole: 'system' });
  await order.save();

  await Cart.updateOne({ userId: order.userId }, { $set: { items: [] } });
}

export const capturePayPalCheckout = asyncHandler(async (req, res) => {
  const { payment, order } = await findPendingPayPal(req);

  if (payment.status === 'succeeded') {
    // Already captured (e.g. a retried request) — just return the order.
    const [data] = await withPayments([order.toObject()]);
    return sendData(res, 200, data);
  }
  if (payment.status !== 'pending' || order.status !== 'pending') {
    throw ApiError.conflict('This PayPal payment is no longer open. Please check out again.');
  }

  const result = await capturePayPalOrder(payment.providerOrderId, payment._id.toString());
  if (result.declined) {
    // Order stays pending so the buyer can choose another funding source.
    throw new ApiError(402, 'PAYMENT_DECLINED', result.message, [{ field: 'paypal', code: 'INSTRUMENT_DECLINED' }]);
  }
  if (result.status !== 'COMPLETED' || result.captureStatus !== 'COMPLETED') {
    throw new ApiError(402, 'PAYMENT_NOT_COMPLETED', 'PayPal has not completed this payment yet. Please try again.');
  }
  if (result.amountCents !== payment.amountCents || result.currency !== 'USD') {
    // Should never happen — the amount is set by our server — but never
    // confirm an order for a different amount than was charged.
    throw new ApiError(409, 'PAYMENT_MISMATCH', 'The PayPal amount does not match the order total');
  }

  await confirmPayPalOrder(order, payment, result);

  const [data] = await withPayments([order.toObject()]);
  sendData(res, 200, data);
  sendMail({ to: req.user.email, ...orderConfirmationEmail(req.user, order) });
});

export const cancelPayPalCheckout = asyncHandler(async (req, res) => {
  const { payment, order } = await findPendingPayPal(req);
  if (order.status === 'pending') {
    await cancelOrderService(order, { byRole: 'customer' });
  }
  const latest = await Payment.findById(payment._id, 'status').lean();
  sendData(res, 200, { orderId: order._id, status: order.status, paymentStatus: latest.status });
});

export const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  sendData(res, 200, await withPayments(orders));
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  const [data] = await withPayments([order]);
  sendData(res, 200, data);
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  await cancelOrderService(order, { byRole: 'customer' });
  const [data] = await withPayments([order.toObject()]);
  sendData(res, 200, data);
});

export const getPaymentConfig = (req, res) => {
  sendData(res, 200, { paypal: paypalPublicConfig() });
};
