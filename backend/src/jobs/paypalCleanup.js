import cron from 'node-cron';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { sendMail } from '../services/mailer.js';
import { orderConfirmationEmail } from '../services/emailTemplates.js';
import { confirmPayPalOrder } from '../controllers/order.controller.js';
import { cancelOrder } from '../services/orderFulfilment.js';
import { getPayPalOrderStatus, isPayPalConfigured } from '../services/paypal.js';

const ABANDON_AFTER_MINUTES = 30;

// PayPal checkouts reserve stock while the buyer is in the PayPal popup.
// If they never come back, release the stock — unless PayPal shows the
// payment was actually completed (e.g. the browser closed mid-redirect).
export async function releaseAbandonedPayPalOrders({ now = Date.now() } = {}) {
  const cutoff = new Date(now - ABANDON_AFTER_MINUTES * 60 * 1000);
  const payments = await Payment.find({ method: 'paypal', status: 'pending', createdAt: { $lt: cutoff } });
  const summary = { checked: payments.length, released: 0, confirmed: 0 };

  for (const payment of payments) {
    const order = await Order.findById(payment.orderId);
    if (!order || order.status !== 'pending') continue;

    const remote = await getPayPalOrderStatus(payment.providerOrderId).catch(() => null);
    if (remote?.status === 'COMPLETED' && remote.captureStatus === 'COMPLETED' && remote.amountCents === payment.amountCents) {
      await confirmPayPalOrder(order, payment, remote);
      const user = await User.findById(order.userId, 'name email').lean();
      if (user) sendMail({ to: user.email, ...orderConfirmationEmail(user, order) });
      summary.confirmed += 1;
    } else {
      await cancelOrder(order, { byRole: 'system' });
      summary.released += 1;
    }
  }
  return summary;
}

export function schedulePayPalCleanup() {
  if (!isPayPalConfigured()) return null;
  return cron.schedule(
    '*/10 * * * *',
    async () => {
      try {
        const summary = await releaseAbandonedPayPalOrders();
        if (summary.checked) console.info('[paypal] cleanup:', summary);
      } catch (err) {
        console.error('[paypal] cleanup failed:', err);
      }
    },
    { name: 'paypal-cleanup', noOverlap: true }
  );
}
