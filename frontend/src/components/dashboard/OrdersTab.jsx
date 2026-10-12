import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { formatPriceCents } from '../../lib/format';

const STATUS_BADGE = {
  confirmed: 'badge-success',
  pending: 'badge-warning',
  cancelled: 'badge-danger',
};

const PAYMENT_LABELS = { credit_card: 'Credit card', cash_on_delivery: 'Cash on delivery' };

export default function OrdersTab({ orders }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-heading font-semibold text-gray-900 mb-6">Order History</h2>
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
          <Link to="/marketplace" className="btn-primary">Browse the Marketplace</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order._id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    {' • '}
                    {PAYMENT_LABELS[order.paymentMethod]}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`badge ${STATUS_BADGE[order.status]} capitalize`}>{order.status}</span>
                  <p className="font-bold text-gray-900 mt-1">${formatPriceCents(order.totalCents)}</p>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 border-t border-gray-100 pt-3">
                {order.items.map((item) => (
                  <li key={item.product} className="flex justify-between gap-4">
                    <Link to={`/product/${item.product}`} className="hover:text-primary">
                      {item.name} × {item.quantity}
                    </Link>
                    <span>${formatPriceCents(item.priceCents * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
