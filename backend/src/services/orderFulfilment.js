import { FULFILMENT_FLOW } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sendMail } from './mailer.js';
import { orderStatusEmail } from './emailTemplates.js';
import { refundPayPalCapture } from './paypal.js';

const rank = (status) => FULFILMENT_FLOW.indexOf(status);

// Orders created before per-item statuses existed have no item.status;
// fall back to the order-level status.
export function itemStatus(order, item) {
  return item.status || (order.status === 'pending' ? 'confirmed' : order.status);
}

// The order is only as far along as its least advanced item.
export function deriveOrderStatus(order) {
  const statuses = order.items.map((item) => itemStatus(order, item));
  if (statuses.every((s) => s === 'cancelled')) return 'cancelled';
  return statuses
    .filter((s) => s !== 'cancelled')
    .reduce((least, s) => (rank(s) < rank(least) ? s : least), 'delivered');
}

export function canCustomerCancel(order) {
  return order.items.every((item) => ['confirmed', 'processing'].includes(itemStatus(order, item)));
}

async function notifyCustomer(order, status) {
  if (!['shipped', 'delivered', 'cancelled'].includes(status)) return;
  const user = await User.findById(order.userId, 'name email').lean();
  if (user) {
    sendMail({ to: user.email, ...orderStatusEmail(user, order, status) });
  }
}

// Recomputes the order status after item changes, records the change, marks
// cash-on-delivery payments as collected on delivery, and emails the customer.
async function syncOrderStatus(order, byRole) {
  const previous = order.status;
  const next = deriveOrderStatus(order);
  if (next === previous) {
    await order.save();
    return;
  }

  order.status = next;
  order.statusHistory.push({ status: next, byRole });
  await order.save();

  if (next === 'delivered' && order.paymentMethod === 'cash_on_delivery' && order.paymentId) {
    await Payment.updateOne(
      { _id: order.paymentId, status: 'pending' },
      { status: 'succeeded', paidAt: new Date() }
    );
  }
  // A PayPal checkout that was never paid isn't a real order to the customer,
  // so don't email them that it was "cancelled".
  if (!(next === 'cancelled' && previous === 'pending')) {
    await notifyCustomer(order, next);
  }
}

// Moves the selected items one step forward (vendors) or up to `target`
// (admins). Throws if no selected item can move to `target`.
export async function advanceItems(order, { target, byRole, isMine = () => true, stepOnly = true }) {
  if (order.status === 'pending') {
    throw ApiError.conflict('This order is still awaiting payment');
  }
  if (!FULFILMENT_FLOW.includes(target) || target === 'confirmed') {
    throw ApiError.badRequest(`Cannot set status to "${target}"`);
  }

  const mine = order.items.filter((item) => isMine(item) && itemStatus(order, item) !== 'cancelled');
  if (mine.length === 0) {
    throw ApiError.badRequest('No active items in this order to update');
  }

  const movable = mine.filter((item) => {
    const current = rank(itemStatus(order, item));
    return stepOnly ? current === rank(target) - 1 : current < rank(target);
  });
  if (movable.length === 0) {
    const current = [...new Set(mine.map((item) => itemStatus(order, item)))].join(', ');
    throw ApiError.conflict(`Items are "${current}" and cannot move to "${target}"`);
  }

  for (const item of order.items) {
    item.status = itemStatus(order, item);
  }
  for (const item of movable) {
    item.status = target;
  }
  await syncOrderStatus(order, byRole);
  return order;
}

// Cancels the whole order: restocks items and refunds/voids the payment.
export async function cancelOrder(order, { byRole }) {
  if (order.status === 'cancelled') {
    throw ApiError.conflict('Order is already cancelled');
  }
  if (byRole === 'customer' && !canCustomerCancel(order)) {
    throw ApiError.conflict('Orders can only be cancelled before they ship');
  }

  // Refund real (sandbox) PayPal payments first, so a failed refund leaves
  // the order untouched and can be retried.
  const payment = order.paymentId ? await Payment.findById(order.paymentId) : null;
  if (payment?.method === 'paypal' && payment.status === 'succeeded' && payment.transactionRef) {
    const refund = await refundPayPalCapture(payment.transactionRef, payment._id.toString());
    payment.refundRef = refund.refundId;
  }

  await Promise.all(
    order.items
      .filter((item) => itemStatus(order, item) !== 'cancelled')
      .map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }))
  );
  for (const item of order.items) {
    item.status = 'cancelled';
  }

  if (payment) {
    if (payment.status === 'succeeded') {
      payment.status = 'refunded';
      payment.refundedAt = new Date();
      await payment.save();
    } else if (payment.status === 'pending') {
      payment.status = 'cancelled';
      await payment.save();
    }
  }

  await syncOrderStatus(order, byRole);
  return order;
}

// Attaches a small payment summary to plain order objects.
export async function withPayments(orders) {
  const ids = orders.map((o) => o.paymentId).filter(Boolean);
  const payments = await Payment.find({ _id: { $in: ids } }, 'status method card transactionRef payerEmail paidAt refundedAt amountCents').lean();
  const byId = new Map(payments.map((p) => [p._id.toString(), p]));
  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({ ...item, status: itemStatus(order, item) })),
    payment: order.paymentId ? byId.get(order.paymentId.toString()) || null : null,
  }));
}
