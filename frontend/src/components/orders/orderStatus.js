export const FULFILMENT_FLOW = ['confirmed', 'processing', 'shipped', 'delivered'];

export const ORDER_STATUS = {
  pending: { label: 'Awaiting payment', className: 'badge-warning' },
  confirmed: { label: 'Confirmed', className: 'badge-info' },
  processing: { label: 'Processing', className: 'badge-warning' },
  shipped: { label: 'Shipped', className: 'badge-info' },
  delivered: { label: 'Delivered', className: 'badge-success' },
  cancelled: { label: 'Cancelled', className: 'badge-danger' },
};

export function nextStatus(status) {
  const index = FULFILMENT_FLOW.indexOf(status);
  return index >= 0 && index < FULFILMENT_FLOW.length - 1 ? FULFILMENT_FLOW[index + 1] : null;
}

const BRAND_LABELS = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', card: 'Card' };

// One-line description of how an order was (or will be) paid.
export function paymentSummary(order) {
  const payment = order.payment;
  if (order.paymentMethod === 'paypal') {
    if (!payment || payment.status === 'pending') return { text: 'PayPal • Awaiting payment', className: 'text-amber-600' };
    if (payment.status === 'refunded') return { text: 'PayPal • Refunded', className: 'text-blue-600' };
    if (payment.status === 'cancelled' || payment.status === 'failed') return { text: 'PayPal • Not completed', className: 'text-gray-500' };
    return { text: `PayPal${payment.payerEmail ? ` (${payment.payerEmail})` : ''} • Paid`, className: 'text-green-600' };
  }
  if (order.paymentMethod === 'cash_on_delivery') {
    if (!payment) return { text: 'Cash on delivery', className: 'text-gray-500' };
    if (payment.status === 'succeeded') return { text: 'Cash on delivery • Collected', className: 'text-green-600' };
    if (payment.status === 'cancelled') return { text: 'Cash on delivery • Cancelled', className: 'text-gray-500' };
    return { text: 'Cash on delivery • Pay when delivered', className: 'text-amber-600' };
  }
  if (!payment) return { text: 'Credit card', className: 'text-gray-500' };
  const card = payment.card ? `${BRAND_LABELS[payment.card.brand] ?? 'Card'} •••• ${payment.card.last4}` : 'Card';
  if (payment.status === 'refunded') return { text: `${card} • Refunded`, className: 'text-blue-600' };
  return { text: `${card} • Paid`, className: 'text-green-600' };
}

export function orderNumber(order) {
  return `#${order._id.slice(-6).toUpperCase()}`;
}
