import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { formatPriceCents } from '../../lib/format';

const RANGES = [
  [7, 'Last 7 days'],
  [30, 'Last 30 days'],
  [90, 'Last 90 days'],
  [365, 'Last 12 months'],
];
const ORDER_STATUS_LABELS = { confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', pending: 'Pending' };
const APPOINTMENT_STATUS_LABELS = { booked: 'Booked', completed: 'Completed', no_show: 'No-show', cancelled: 'Cancelled' };
const TYPE_LABELS = { vet: 'Veterinary', grooming: 'Grooming', unknown: 'Other' };
const ROLE_LABELS = { customer: 'Customers', vendor: 'Vendors', admin: 'Admins' };
const PAYMENT_LABELS = { credit_card: 'Card', cash_on_delivery: 'Cash on delivery', paypal: 'PayPal' };

// Compact money for axis ticks and tiles: $950, $1.2K, $12K, $1.4M.
function compactMoney(cents) {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(dollars >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return `$${Math.round(dollars)}`;
}

// A "nice" axis maximum (1, 2, 2.5, 5 × 10^n) at or above the data max.
function niceMax(value) {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value);
  return step * magnitude;
}

// Every period in the range, so days without sales show as empty, not skipped.
// Periods are the app's calendar days/months (YYYY-MM-DD or YYYY-MM).
function fillPeriods(rows, days, bucket) {
  const byPeriod = new Map(rows.map((r) => [r.period, r]));
  const periods = [];
  const end = new Date();
  if (bucket === 'month') {
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
      periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
  } else {
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
      periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  }
  return periods.map((period) => byPeriod.get(period) ?? { period, revenueCents: 0, orders: 0 });
}

function periodLabel(period, bucket, style = 'short') {
  const [y, m, d] = period.split('-').map(Number);
  const date = new Date(y, m - 1, d || 1);
  return bucket === 'month'
    ? date.toLocaleDateString(undefined, { month: style, year: style === 'long' ? 'numeric' : undefined })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: style === 'long' ? 'short' : undefined });
}

function StatTile({ label, value }) {
  return (
    <div className="stat-card">
      <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

// Single-series column chart: hairline grid, ≤24px columns with a rounded
// top, per-column tooltip on hover and keyboard focus.
function RevenueChart({ data, bucket }) {
  const [active, setActive] = useState(null);
  const max = niceMax(Math.max(...data.map((d) => d.revenueCents)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const labelEvery = Math.ceil(data.length / 8);

  return (
    <div className="relative">
      <div className="flex">
        {/* Y axis */}
        <div className="relative w-12 shrink-0 h-56 text-xs text-gray-400 tabular-nums" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute right-2 -translate-y-1/2" style={{ bottom: `${(t / max) * 100}%`, transform: 'translateY(50%)' }}>
              {compactMoney(t)}
            </span>
          ))}
        </div>
        {/* Plot */}
        <div className="relative flex-1 h-56">
          {ticks.map((t) => (
            <div key={t} className="absolute left-0 right-0 border-t border-gray-100" style={{ bottom: `${(t / max) * 100}%` }} aria-hidden="true" />
          ))}
          <div className="absolute inset-0 flex items-end" role="list" aria-label="Revenue by period">
            {data.map((d, i) => (
              <div
                key={d.period}
                role="listitem"
                tabIndex={0}
                aria-label={`${periodLabel(d.period, bucket, 'long')}: $${formatPriceCents(d.revenueCents)} from ${d.orders} order${d.orders === 1 ? '' : 's'}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="relative flex-1 h-full flex items-end justify-center outline-none focus-visible:bg-primary/5 cursor-default"
              >
                <div
                  className={`w-full max-w-[24px] mx-px rounded-t ${active === i ? 'bg-primary-dark' : 'bg-primary'}`}
                  style={{ height: d.revenueCents ? `max(2px, ${(d.revenueCents / max) * 100}%)` : 0 }}
                />
              </div>
            ))}
          </div>
          {active !== null && (
            <div
              className="absolute z-10 bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-sm pointer-events-none whitespace-nowrap"
              style={{
                // Just above the hovered column, kept inside the plot so it never
                // covers the title; flips side near the right edge.
                bottom: `min(calc(${(data[active].revenueCents / max) * 100}% + 8px), calc(100% - 3.5rem))`,
                ...(active / data.length > 0.6
                  ? { right: `${((data.length - active - 0.5) / data.length) * 100}%` }
                  : { left: `${((active + 0.5) / data.length) * 100}%` }),
              }}
              role="status"
            >
              <p className="font-semibold text-gray-900 tabular-nums">${formatPriceCents(data[active].revenueCents)}</p>
              <p className="text-gray-500">
                {periodLabel(data[active].period, bucket, 'long')} · {data[active].orders} order{data[active].orders === 1 ? '' : 's'}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* X axis */}
      <div className="flex ml-12 mt-2 text-xs text-gray-400" aria-hidden="true">
        {data.map((d, i) => (
          <span key={d.period} className="flex-1 text-center whitespace-nowrap overflow-visible">
            {i % labelEvery === 0 ? periodLabel(d.period, bucket) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

// Labelled horizontal bars (one colour; value at the bar end).
function BarList({ rows, valueLabel, empty }) {
  if (rows.length === 0) return <p className="text-sm text-gray-500">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value)) || 1;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3 text-sm mb-1">
            <span className="text-gray-700 truncate">{r.label}</span>
            <span className="text-gray-900 font-medium tabular-nums shrink-0">{valueLabel(r)}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded" aria-hidden="true">
            <div className="h-full bg-primary rounded" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <section className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <h2 className="font-heading font-semibold text-lg text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function ReportsPanel() {
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest(`/admin/reports?days=${days}`, { token })
      .then(({ data }) => active && setReport(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setRefreshing(false));
    return () => {
      active = false;
    };
  }, [days, token]);

  const series = useMemo(() => (report ? fillPeriods(report.revenue, report.days, report.bucket) : []), [report]);

  const chooseRange = (value) => {
    setRefreshing(true);
    setDays(value);
  };

  return (
    <div>
      {/* One filter row above everything it scopes */}
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Report period">
        {RANGES.map(([value, label]) => (
          <button key={value} type="button" onClick={() => chooseRange(value)} aria-pressed={days === value} className={`btn-toggle ${days === value ? 'btn-toggle-active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}
      {!report ? (
        <p className="text-gray-500">Loading reports...</p>
      ) : (
        // Refetch keeps the previous render, dimmed, instead of flashing.
        <div className={`space-y-6 transition-opacity ${refreshing ? 'opacity-50' : ''}`} aria-busy={refreshing}>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatTile label="Revenue" value={compactMoney(report.totals.revenueCents)} />
            <StatTile label="Orders" value={report.totals.orders.toLocaleString()} />
            <StatTile label="Average order" value={`$${formatPriceCents(report.totals.averageOrderCents)}`} />
            <StatTile label="Appointments booked" value={report.totals.appointments.toLocaleString()} />
            <StatTile label="New users" value={report.totals.newUsers.toLocaleString()} />
          </div>

          <Card title={`Revenue by ${report.bucket} (excluding cancelled orders)`}>
            {report.totals.orders === 0 ? (
              <p className="text-sm text-gray-500">No orders in this period.</p>
            ) : (
              <RevenueChart data={series} bucket={report.bucket} />
            )}
            <button type="button" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable} className="mt-4 text-sm text-primary font-medium hover:underline">
              {showTable ? 'Hide table' : 'Show as table'}
            </button>
            {showTable && (
              <div className="mt-3 max-h-72 overflow-y-auto border border-gray-100 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-left text-xs uppercase text-gray-500">
                      <th className="px-4 py-2">{report.bucket === 'month' ? 'Month' : 'Day'}</th>
                      <th className="px-4 py-2 text-right">Orders</th>
                      <th className="px-4 py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 tabular-nums">
                    {series.map((d) => (
                      <tr key={d.period}>
                        <td className="px-4 py-2 text-gray-700">{periodLabel(d.period, report.bucket, 'long')}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{d.orders}</td>
                        <td className="px-4 py-2 text-right text-gray-900">${formatPriceCents(d.revenueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Top products by revenue">
              <BarList
                rows={report.topProducts.map((p) => ({ label: p.name, value: p.revenueCents, quantity: p.quantity }))}
                valueLabel={(r) => `$${formatPriceCents(r.value)} · ${r.quantity} sold`}
                empty="No sales in this period."
              />
            </Card>
            <Card title="Orders by status">
              <BarList
                rows={[...report.ordersByStatus].sort((a, b) => b.count - a.count).map((o) => ({ label: ORDER_STATUS_LABELS[o.status] ?? o.status, value: o.count }))}
                valueLabel={(r) => r.value}
                empty="No orders in this period."
              />
              {report.paymentMethods.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                  Paid by{' '}
                  {report.paymentMethods
                    .map((p) => `${PAYMENT_LABELS[p.method] ?? p.method}: ${p.count} (${compactMoney(p.revenueCents)})`)
                    .join(' · ')}
                </p>
              )}
            </Card>
            <Card title="Appointments">
              <BarList
                rows={[...report.appointmentsByStatus].sort((a, b) => b.count - a.count).map((a) => ({ label: APPOINTMENT_STATUS_LABELS[a.status] ?? a.status, value: a.count }))}
                valueLabel={(r) => r.value}
                empty="No appointments booked in this period."
              />
              {report.appointmentsByType.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                  {report.appointmentsByType.map((t) => `${TYPE_LABELS[t.type] ?? t.type}: ${t.count}`).join(' · ')}
                </p>
              )}
            </Card>
            <Card title="New sign-ups">
              <BarList
                rows={[...report.signupsByRole].sort((a, b) => b.count - a.count).map((u) => ({ label: ROLE_LABELS[u.role] ?? u.role, value: u.count }))}
                valueLabel={(r) => r.value}
                empty="No new users in this period."
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
