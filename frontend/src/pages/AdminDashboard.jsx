import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Calendar, CheckCircle2, Info, Mail, Package, ShieldCheck, ShoppingBag, Store, Users, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { formatPriceCents } from '../lib/format';
import ManageOrdersPanel from '../components/orders/ManageOrdersPanel';
import UsersPanel from '../components/admin/UsersPanel';
import ApplicationsPanel from '../components/admin/ApplicationsPanel';
import ProductsPanel from '../components/admin/ProductsPanel';
import AppointmentsPanel from '../components/admin/AppointmentsPanel';
import ReportsPanel from '../components/admin/ReportsPanel';

const VIEWS = [
  { id: 'overview', icon: Activity, label: 'Platform Health' },
  { id: 'orders', icon: ShoppingBag, label: 'Orders', intro: "Fulfil PawMart's own items, move any order forward, or cancel and refund it." },
  { id: 'users', icon: Users, label: 'Manage Users', intro: 'Suspended users are signed out, cannot sign in, and their products and services are hidden from customers.' },
  { id: 'applications', icon: Store, label: 'Vendor Verification' },
  { id: 'products', icon: Package, label: 'Products', intro: "Hide any listing from customers, and manage PawMart's own catalogue (vendors manage their own products)." },
  { id: 'appointments', icon: Calendar, label: 'Appointments', intro: 'PawMart Clinic services are run by admins; you can also step in on any provider booking.' },
  { id: 'reports', icon: BarChart3, label: 'Analytics Reports' },
];

const ALERT_STYLE = {
  danger: { box: 'border-red-200 bg-red-50', icon: XCircle, iconClass: 'text-red-500', title: 'text-red-800', text: 'text-red-700' },
  warning: { box: 'border-orange-200 bg-orange-50', icon: AlertTriangle, iconClass: 'text-orange-500', title: 'text-orange-800', text: 'text-orange-700' },
  info: { box: 'border-gray-200 bg-white', icon: Info, iconClass: 'text-gray-400', title: 'text-gray-900', text: 'text-gray-500' },
};

function Overview({ stats, loading, onNavigate, onApplicationsChanged }) {
  const tiles = [
    ['Total Users', stats?.totalUsers, stats?.suspendedUsers ? `${stats.suspendedUsers} suspended` : null, 'border-l-primary'],
    ['Registered Vendors', stats?.totalVendors, stats?.pendingVendorApplications ? `+${stats.pendingVendorApplications} pending` : null, 'border-l-secondary'],
    ['Orders', stats?.totalOrders, stats ? `$${formatPriceCents(stats.revenueCents)} revenue` : null, 'border-l-blue-500'],
    ['Active Bookings', stats?.totalAppointments, null, 'border-l-purple-500'],
  ];
  const alerts = stats?.alerts ?? [];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {tiles.map(([label, value, sub, border]) => (
          <div key={label} className={`stat-card border-l-4 ${border}`}>
            <p className="text-gray-500 font-medium mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{loading ? '...' : value ?? 0}</p>
            {sub && <p className="text-sm text-gray-500 mt-2">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ApplicationsPanel compact onChanged={onApplicationsChanged} />

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <h2 className="font-heading font-semibold text-lg text-gray-900">System Alerts</h2>
          </div>
          <div className="p-6 space-y-4">
            {loading ? (
              <p className="text-gray-500 text-sm">Checking...</p>
            ) : alerts.length === 0 ? (
              <div className="alert alert-success">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-green-800">All clear</h3>
                  <p className="text-sm text-green-700 mt-1">Nothing needs your attention right now.</p>
                </div>
              </div>
            ) : (
              alerts.map((alert) => {
                const style = ALERT_STYLE[alert.level] ?? ALERT_STYLE.info;
                const Icon = style.icon;
                return (
                  <div key={alert.title} className={`alert ${style.box}`}>
                    <Icon className={`h-6 w-6 shrink-0 ${style.iconClass}`} aria-hidden="true" />
                    <div>
                      <h3 className={`font-bold ${style.title}`}>
                        <span className="sr-only">{alert.level}: </span>
                        {alert.title}
                      </h3>
                      <p className={`text-sm mt-1 ${style.text}`}>{alert.message}</p>
                      {alert.view && (
                        <button type="button" onClick={() => onNavigate(alert.view)} className={`mt-2 text-xs font-bold underline ${style.title}`}>
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningReminders, setRunningReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);
  const [view, setView] = useState('overview');

  const isAdmin = user?.role === 'admin';

  const loadStats = useCallback(
    () =>
      apiRequest('/admin/stats', { token })
        .then(({ data }) => setStats(data))
        .catch((err) => setError(err))
        .finally(() => setLoading(false)),
    [token]
  );

  useEffect(() => {
    if (isAdmin) loadStats();
  }, [isAdmin, loadStats]);

  // Refresh the health numbers whenever the admin comes back to the overview.
  const navigate = (next) => {
    setView(next);
    if (next === 'overview') loadStats();
  };

  const runReminders = async () => {
    setRunningReminders(true);
    setReminderResult(null);
    try {
      const { data } = await apiRequest('/admin/reminders/vaccinations/run', { method: 'POST', token });
      setReminderResult({
        ok: data.emailsFailed === 0,
        text:
          data.emailsSent === 0 && data.emailsFailed === 0
            ? 'No vaccination reminders were due.'
            : `Sent ${data.emailsSent} reminder email${data.emailsSent === 1 ? '' : 's'} covering ${data.vaccinations} vaccination${data.vaccinations === 1 ? '' : 's'}${data.emailsFailed ? `; ${data.emailsFailed} failed and will be retried` : ''}.`,
      });
    } catch (err) {
      setReminderResult({ ok: false, text: `Couldn't run reminders: ${err.message}` });
    } finally {
      setRunningReminders(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-6">
        <p className="text-gray-600">Please log in to access the Admin Hub.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-6">
        <p className="text-gray-600">Admin access required.</p>
      </div>
    );
  }

  const current = VIEWS.find((v) => v.id === view);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-white hidden md:block">
        <div className="p-6">
          <div className="mb-8 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-heading font-bold text-xl text-white">Admin Hub</h2>
              <p className="text-xs text-gray-400">System Overview</p>
            </div>
          </div>

          <nav className="space-y-1" aria-label="Admin">
            {VIEWS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                aria-current={view === id ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-left transition-colors ${
                  view === id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" /> {label}
                {id === 'applications' && stats?.pendingVendorApplications > 0 && (
                  <span className="ml-auto badge bg-secondary text-white !py-0">{stats.pendingVendorApplications}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 min-w-0">
        <div className="max-w-6xl mx-auto">
          {/* Mobile view switcher (sidebar is hidden on small screens) */}
          <div className="md:hidden mb-6">
            <label htmlFor="admin-view" className="sr-only">Admin section</label>
            <select id="admin-view" className="input-field" value={view} onChange={(e) => navigate(e.target.value)}>
              {VIEWS.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4 justify-between items-center mb-2">
            <h1 className="text-3xl font-heading font-bold text-gray-900">{view === 'overview' ? 'Platform Overview' : current.label}</h1>
            {view === 'overview' && (
              <button
                type="button"
                onClick={runReminders}
                disabled={runningReminders}
                title="Email owners whose pets have vaccinations due within 7 days or overdue"
                className="btn-outline flex items-center gap-2 disabled:opacity-50"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {runningReminders ? 'Sending...' : 'Send Vaccine Reminders Now'}
              </button>
            )}
          </div>
          <p className="text-gray-500 mb-8">{current.intro ?? ''}</p>

          {reminderResult && view === 'overview' && (
            <div className={`alert ${reminderResult.ok ? 'alert-success' : 'alert-warning'} mb-8`} role="status">
              <p className={`text-sm ${reminderResult.ok ? 'text-green-700' : 'text-orange-700'}`}>{reminderResult.text}</p>
            </div>
          )}
          {error && view === 'overview' && (
            <div className="alert alert-warning mb-8" role="alert">
              <p className="text-sm text-orange-700">{error.message}</p>
            </div>
          )}

          {view === 'overview' && <Overview stats={stats} loading={loading} onNavigate={navigate} onApplicationsChanged={loadStats} />}
          {view === 'orders' && <ManageOrdersPanel mode="admin" />}
          {view === 'users' && <UsersPanel />}
          {view === 'applications' && <ApplicationsPanel onChanged={loadStats} />}
          {view === 'products' && <ProductsPanel />}
          {view === 'appointments' && <AppointmentsPanel />}
          {view === 'reports' && <ReportsPanel />}
        </div>
      </main>
    </div>
  );
}
