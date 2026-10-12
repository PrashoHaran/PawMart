import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { sendMail } from '../services/mailer.js';
import { orderConfirmationEmail } from '../services/emailTemplates.js';
import { cardSummary, charge, validateCard } from '../services/paymentGateway.js';
import { cancelOrder as cancelOrderService, withPayments } from '../services/orderFulfilment.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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

export const createOrder = asyncHandler(async (req, res) => {
  const { paymentMethod, card, shippingAddress } = req.body;

  // Reject malformed card details before touching stock.
  if (paymentMethod === 'credit_card') {
    const problems = validateCard(card);
    if (problems.length) {
      throw ApiError.badRequest('Invalid card details', problems);
    }
  }

  const cart = await Cart.findOne({ userId: req.user._id }).populate(
    'items.product',
    'name priceCents stock vendorId'
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
      await restock(decremented);
      throw ApiError.conflict(`Insufficient stock for "${item.product.name}"`, [
        { field: 'items', productId: item.product._id.toString() },
      ]);
    }

    decremented.push({ productId: item.product._id, quantity: item.quantity });
  }

  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    vendorId: item.product.vendorId || null,
    name: item.product.name,
    priceCents: item.product.priceCents,
    quantity: item.quantity,
  }));

  const subtotalCents = orderItems.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const shippingCents = subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + shippingCents + taxCents;

  // Simulated card charge. On decline: restock, keep the cart, record the
  // failed attempt, and let the customer retry with corrected details.
  let paymentFields;
  if (paymentMethod === 'credit_card') {
    const result = charge(card);
    if (!result.ok) {
      await restock(decremented);
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
    items: orderItems,
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
