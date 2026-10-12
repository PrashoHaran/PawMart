import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { formatPriceCents } from '../../lib/format';
import OrderProgress from '../orders/OrderProgress';
import { ORDER_STATUS, orderNumber, paymentSummary } from '../orders/orderStatus';

function canCancel(order) {
  return order.items.every((item) => ['confirmed', 'processing'].includes(item.status));
}

function OrderCard({ order, onCancel }) {
  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.confirmed;
  const payment = paymentSummary(order);
  const mixedStatuses = new Set(order.items.map((i) => i.status)).size > 1;
  const lastUpdate = order.statusHistory?.at(-1);

  return (
    <li className="border border-gray-100 rounded-xl p-4">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
        <div>
          <p className="font-semibold text-gray-900">Order {orderNumber(order)}</p>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
          <p className={`text-sm font-medium ${payment.className}`}>{payment.text}</p>
        </div>
        <div className="text-right">
          <span className={`badge ${status.className}`}>{status.label}</span>
          <p className="font-bold text-gray-900 mt-1">${formatPriceCents(order.totalCents)}</p>
        </div>
      </div>

      <div className="mb-4">
        <OrderProgress status={order.status} />
      </div>

      <ul className="text-sm text-gray-600 space-y-1 border-t border-gray-100 pt-3">
        {order.items.map((item) => (
          <li key={item.product} className="flex justify-between gap-4">
            <span>
              <Link to={`/product/${item.product}`} className="hover:text-primary">
                {item.name} × {item.quantity}
              </Link>
              {mixedStatuses && (
                <span className={`badge ${ORDER_STATUS[item.status].className} ml-2 !py-0`}>{ORDER_STATUS[item.status].label}</span>
              )}
            </span>
            <span>${formatPriceCents(item.priceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-between items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          {lastUpdate && `Last update: ${ORDER_STATUS[lastUpdate.status]?.label} on ${new Date(lastUpdate.at).toLocaleDateString()}`}
        </p>
        {order.status !== 'cancelled' && canCancel(order) && (
          <button
            type="button"
            onClick={() => onCancel(order)}
            className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Cancel Order
          </button>
        )}
      </div>
    </li>
  );
}

export default function OrdersTab({ orders, onOrdersChanged }) {
  const { token } = useAuth();
  const [error, setError] = useState(null);

  const handleCancel = async (order) => {
    const refund = order.paymentMethod === 'credit_card' ? ' Your card payment will be refunded.' : '';
    if (!window.confirm(`Cancel order ${orderNumber(order)}?${refund}`)) return;
    setError(null);
    try {
      await apiRequest(`/orders/${order._id}/cancel`, { method: 'POST', token });
      onOrdersChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-heading font-semibold text-gray-900 mb-6">Order History</h2>
      {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
          <Link to="/marketplace" className="btn-primary">Browse the Marketplace</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} onCancel={handleCancel} />
          ))}
        </ul>
      )}
    </div>
  );
}
