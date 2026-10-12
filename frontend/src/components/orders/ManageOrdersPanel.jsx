import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { formatPriceCents } from '../../lib/format';
import { FULFILMENT_FLOW, ORDER_STATUS, nextStatus, orderNumber, paymentSummary } from './orderStatus';

const PAGE_SIZE = 10;
const FILTERS = ['', ...FULFILMENT_FLOW, 'cancelled'];

// The status the given items can move to next (based on the least advanced).
function nextFor(items) {
  const active = items.filter((i) => i.status !== 'cancelled');
  if (active.length === 0) return null;
  const least = active.reduce((a, i) => (FULFILMENT_FLOW.indexOf(i.status) < FULFILMENT_FLOW.indexOf(a) ? i.status : a), 'delivered');
  return nextStatus(least);
}

function OrderRow({ order, mode, busy, onAdvance, onCancel }) {
  const [open, setOpen] = useState(false);
  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.confirmed;
  const next = nextFor(order.items);
  const payment = paymentSummary(order);
  const amount = mode === 'vendor' ? order.vendorSubtotalCents : order.totalCents;
  const address = order.shippingAddress;

  return (
    <li className="border border-gray-100 rounded-xl">
      <div className="flex flex-wrap items-center gap-4 p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex-1 min-w-[200px] text-left"
        >
          <p className="font-semibold text-gray-900">
            Order {orderNumber(order)} <span className="text-gray-400 font-normal text-sm">• {order.customer?.name ?? 'Unknown customer'}</span>
          </p>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} •{' '}
            {order.items.length} item{order.items.length === 1 ? '' : 's'}
            {mode === 'vendor' && ' from you'}
          </p>
        </button>
        <div className="text-right">
          <span className={`badge ${status.className}`}>{status.label}</span>
          <p className="font-bold text-gray-900 mt-1">${formatPriceCents(amount)}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {next && (
            <button type="button" disabled={busy} onClick={() => onAdvance(order, next)} className="btn-primary text-sm whitespace-nowrap disabled:opacity-50">
              Mark {ORDER_STATUS[next].label}
            </button>
          )}
          {mode === 'admin' && !['cancelled', 'delivered'].includes(order.status) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onCancel(order)}
              className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Items</h4>
            <ul className="space-y-1 text-gray-600">
              {order.items.map((item) => (
                <li key={item.product} className="flex justify-between gap-3">
                  <span>
                    {item.name} × {item.quantity}
                    {mode === 'admin' && <span className="text-gray-400"> ({item.vendorName})</span>}
                  </span>
                  <span className={`badge ${ORDER_STATUS[item.status].className} !py-0 shrink-0`}>{ORDER_STATUS[item.status].label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Customer</h4>
              <p>{order.customer?.name} {order.customer?.email && `• ${order.customer.email}`}</p>
            </div>
            {address?.address && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Ship to</h4>
                <p>
                  {address.firstName} {address.lastName}, {address.address}, {address.city} {address.postalCode}
                </p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Payment</h4>
              <p className={payment.className}>{payment.text}</p>
              {order.payment?.transactionRef && <p className="text-xs text-gray-400">Ref {order.payment.transactionRef}</p>}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

// Order list with status filter and fulfilment actions. `mode` is "vendor"
// (only the vendor's items, step-by-step) or "admin" (whole orders, can cancel).
export default function ManageOrdersPanel({ mode, onChanged }) {
  const { token } = useAuth();
  const basePath = mode === 'admin' ? '/admin/orders' : '/vendor/orders';
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (statusFilter) params.set('status', statusFilter);
    return apiRequest(`${basePath}?${params}`, { token })
      .then(({ data, meta }) => {
        setOrders(data);
        setTotal(meta.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [basePath, token, page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (order, status) => {
    setBusyId(order._id);
    setError(null);
    try {
      await apiRequest(`${basePath}/${order._id}/status`, { method: 'PATCH', token, body: { status } });
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (order) => {
    const refund = order.paymentMethod === 'credit_card' ? ' The card payment will be refunded.' : '';
    if (window.confirm(`Cancel order ${orderNumber(order)}? Stock will be restored.${refund}`)) {
      update(order, 'cancelled');
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="font-heading font-semibold text-lg text-gray-900">
          {mode === 'admin' ? 'All Orders' : 'Orders for Your Products'}
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Status
          <select
            className="input-field !w-auto !py-1.5"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            {FILTERS.map((f) => (
              <option key={f || 'all'} value={f}>{f ? ORDER_STATUS[f].label : 'All'}</option>
            ))}
          </select>
        </label>
      </div>

      {mode === 'vendor' && (
        <p className="text-sm text-gray-500 mb-4">
          You fulfil only your own items. Orders that also contain other sellers&apos; items show the overall status of the whole order.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 text-sm">No orders{statusFilter && ` with status "${ORDER_STATUS[statusFilter].label}"`}.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              mode={mode}
              busy={busyId === order._id}
              onAdvance={update}
              onCancel={handleCancel}
            />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex justify-between items-center mt-6 text-sm">
          <button type="button" className="btn-outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-gray-500">Page {page} of {pages}</span>
          <button type="button" className="btn-outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
