import { useEffect, useState } from 'react';
import { Users, AlertTriangle, ShieldCheck, Database, Settings, Store, Activity, PieChart, Mail, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import ManageOrdersPanel from '../components/orders/ManageOrdersPanel';

// `id` links switch the main view; links without one aren't built yet.
const SIDEBAR_LINKS = [
  { icon: Activity, label: 'Platform Health', id: 'overview' },
  { icon: ShoppingBag, label: 'Orders', id: 'orders' },
  { icon: Users, label: 'Manage Users' },
  { icon: Store, label: 'Vendor Verification' },
  { icon: PieChart, label: 'Analytics Reports' },
  { icon: Settings, label: 'Global Settings', spaced: true },
];

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningReminders, setRunningReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);
  const [view, setView] = useState('overview');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([
      apiRequest('/admin/stats', { token }),
      apiRequest('/vendor-applications', { token }),
    ])
      .then(([statsRes, appsRes]) => {
        setStats(statsRes.data);
        setApplications(appsRes.data);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [isAdmin, token]);

  const reviewApplication = async (id, action) => {
    try {
      await apiRequest(`/vendor-applications/${id}/${action}`, { method: 'POST', token });
      setApplications((prev) => prev.filter((a) => a._id !== id));
      setStats((prev) =>
        prev ? { ...prev, pendingVendorApplications: prev.pendingVendorApplications - 1 } : prev
      );
    } catch (err) {
      setError(err);
    }
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

          <nav className="space-y-2">
            {SIDEBAR_LINKS.map(({ icon: Icon, label, id, spaced }) => (
              <button
                key={label}
                type="button"
                onClick={id ? () => setView(id) : undefined}
                aria-current={view === id ? 'page' : undefined}
                aria-disabled={!id}
                title={id ? undefined : 'Coming soon'}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-left transition-colors ${spaced ? 'mt-8' : ''} ${
                  view === id
                    ? 'bg-white/10 text-white'
                    : id
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-400 hover:bg-white/5 cursor-not-allowed opacity-60'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" /> {label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          {/* Mobile view switcher (sidebar is hidden on small screens) */}
          <div className="md:hidden flex gap-2 mb-6">
            {SIDEBAR_LINKS.filter((l) => l.id).map(({ label, id }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-current={view === id ? 'page' : undefined}
                className={`btn-toggle ${view === id ? 'btn-toggle-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          {view === 'orders' ? (
            <>
              <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Orders</h1>
              <p className="text-gray-500 mb-8">
                Fulfil PawMart&apos;s own items, move any order forward, or cancel and refund it.
              </p>
              <ManageOrdersPanel mode="admin" />
            </>
          ) : (
          <>
          <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900">Platform Overview</h1>
            <div className="flex flex-wrap gap-4 items-center">
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
              <span className="badge badge-success !px-4 !py-2 !text-sm">
                <Database className="h-4 w-4" aria-hidden="true" /> Systems Operational
              </span>
            </div>
          </div>

          {reminderResult && (
            <div className={`alert ${reminderResult.ok ? 'alert-success' : 'alert-warning'} mb-8`} role="status">
              <p className={`text-sm ${reminderResult.ok ? 'text-green-700' : 'text-orange-700'}`}>{reminderResult.text}</p>
            </div>
          )}

          {error && (
            <div className="alert alert-warning mb-8" role="alert">
              <p className="text-sm text-orange-700">{error.message}</p>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="stat-card border-l-4 border-l-primary">
              <p className="text-gray-500 font-medium mb-1">Total Users</p>
              <h3 className="text-3xl font-bold text-gray-900">{loading ? '...' : stats?.totalUsers ?? 0}</h3>
            </div>
            <div className="stat-card border-l-4 border-l-secondary">
              <p className="text-gray-500 font-medium mb-1">Registered Vendors</p>
              <h3 className="text-3xl font-bold text-gray-900">{loading ? '...' : stats?.totalVendors ?? 0}</h3>
              <p className="text-sm text-green-600 mt-2 font-medium">+{applications.length} pending applications</p>
            </div>
            <div className="stat-card border-l-4 border-l-blue-500">
              <p className="text-gray-500 font-medium mb-1">Appointments Booked</p>
              <h3 className="text-3xl font-bold text-gray-900">{loading ? '...' : stats?.totalAppointments ?? 0}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vendor Applications */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="font-heading font-semibold text-lg text-gray-900">Pending Vendor Approvals</h2>
                <span className="badge bg-secondary text-white">{applications.length} Pending</span>
              </div>
              <div className="p-0">
                {loading ? (
                  <p className="p-6 text-center text-gray-500">Loading...</p>
                ) : applications.length === 0 ? (
                  <p className="p-6 text-center text-gray-500">No pending applications.</p>
                ) : (
                <ul className="divide-y divide-gray-100">
                  {applications.map((app) => (
                  <li key={app._id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{app.businessName}</h4>
                      <p className="text-sm text-gray-500">
                        {app.businessType === 'service_provider' ? 'Service Provider' : 'Retail Vendor'} • {app.userId?.name} ({app.userId?.email})
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => reviewApplication(app._id, 'approve')}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded font-medium text-sm hover:bg-green-200 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reviewApplication(app._id, 'reject')}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded font-medium text-sm hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                  ))}
                </ul>
                )}
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                <h2 className="font-heading font-semibold text-lg text-gray-900">System Alerts</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="alert alert-warning" role="alert">
                  <AlertTriangle className="h-6 w-6 text-orange-500 shrink-0" aria-hidden="true" />
                  <div>
                    <h4 className="font-bold text-orange-800">High API Latency</h4>
                    <p className="text-sm text-orange-700 mt-1">Payment Simulation module is experiencing higher than normal response times (Avg: 800ms).</p>
                    <button type="button" aria-disabled="true" title="Coming soon" className="mt-2 text-xs font-bold text-orange-800/60 underline cursor-not-allowed">View Logs</button>
                  </div>
                </div>

                <div className="alert alert-info">
                  <Activity className="h-6 w-6 text-gray-400 shrink-0" aria-hidden="true" />
                  <div>
                    <h4 className="font-bold text-gray-900">Database Backup Completed</h4>
                    <p className="text-sm text-gray-500 mt-1">Automated MongoDB Atlas snapshot was created successfully at 03:00 AM UTC.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>
          )}

        </div>
      </main>
    </div>
  );
}
