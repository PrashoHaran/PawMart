import { useCallback, useEffect, useState } from 'react';
import { Calendar, CheckCircle2, DollarSign, Edit2, Plus, Scissors, Stethoscope, Trash2, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { formatPriceCents } from '../../lib/format';
import ServiceForm from './ServiceForm';

const VIEWS = [
  { id: 'overview', icon: TrendingUp, label: 'Overview' },
  { id: 'appointments', icon: Calendar, label: 'Appointments' },
  { id: 'services', icon: Scissors, label: 'Services' },
];
const DEFAULT_SERVICE = {
  name: '',
  description: '',
  type: 'grooming',
  durationMinutes: 60,
  price: '',
  timeSlots: ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'],
  availableDays: [1, 2, 3, 4, 5, 6],
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_BADGE = {
  booked: { label: 'Booked', className: 'badge-info' },
  completed: { label: 'Completed', className: 'badge-success' },
  no_show: { label: 'No-show', className: 'badge-warning' },
  cancelled: { label: 'Cancelled', className: 'badge-danger' },
};

function errorText(err) {
  return err.details?.[0]?.message ?? err.message;
}

function AppointmentRow({ appointment, onStatus, busy, now }) {
  const when = new Date(appointment.scheduledAt);
  const started = when.getTime() <= now;
  const awaitingOutcome = appointment.status === 'booked' && started;
  const badge = awaitingOutcome ? { label: 'Needs update', className: 'badge-warning' } : STATUS_BADGE[appointment.status];
  const pet = appointment.petId;

  return (
    <li className="flex flex-wrap gap-4 p-4 border border-gray-100 rounded-xl">
      <div className="flex flex-col items-center justify-center min-w-[60px] bg-gray-50 rounded-lg p-2 text-primary font-bold">
        <span className="text-xs uppercase text-gray-500">{when.toLocaleDateString(undefined, { month: 'short' })}</span>
        <span className="text-xl">{when.getDate()}</span>
      </div>
      <div className="flex-1 min-w-[200px]">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-bold text-gray-900">{appointment.service?.name}</h3>
          <span className={`badge ${badge.className}`}>{badge.label}</span>
        </div>
        <p className="text-sm text-gray-500">
          {when.toLocaleDateString(undefined, { weekday: 'long' })} • {appointment.timeSlotLabel} • {appointment.service?.durationMinutes} min
        </p>
        <p className="text-sm text-gray-700 mt-1">
          {appointment.customer?.name} ({appointment.customer?.email}) • {pet ? `${pet.name}${pet.breed ? `, ${pet.breed}` : ''}` : appointment.petDescription}
        </p>
        {pet?.allergies?.length > 0 && <p className="text-sm text-amber-700">Allergies: {pet.allergies.join(', ')}</p>}
        {appointment.notes && <p className="text-sm text-gray-600 mt-1">“{appointment.notes}”</p>}
        {appointment.cancelReason && <p className="text-sm text-red-600 mt-1">Cancelled: {appointment.cancelReason}</p>}
        {appointment.status === 'cancelled' && appointment.cancelledBy === 'customer' && (
          <p className="text-sm text-gray-500 mt-1">Cancelled by the customer</p>
        )}
      </div>
      {appointment.status === 'booked' && (
        <div className="flex flex-wrap gap-2 self-start">
          {started ? (
            <>
              <button type="button" disabled={busy} onClick={() => onStatus(appointment, 'completed')} className="btn-primary text-sm disabled:opacity-50">
                Mark Completed
              </button>
              <button type="button" disabled={busy} onClick={() => onStatus(appointment, 'no_show')} className="btn-outline text-sm disabled:opacity-50">
                No-show
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => onStatus(appointment, 'cancelled')}
              className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function AppointmentsView({ token, scopeDefault = 'upcoming', limit = 20, compact = false, onChanged }) {
  const [scope, setScope] = useState(scopeDefault);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  // Time the list was loaded; decides which bookings have started.
  const [now, setNow] = useState(0);

  const load = useCallback(
    () =>
      apiRequest(`/provider/appointments?scope=${scope}&limit=${limit}`, { token })
        .then(({ data }) => {
          setAppointments(data);
          setNow(Date.now());
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [scope, limit, token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (appointment, status) => {
    let reason;
    if (status === 'cancelled') {
      reason = window.prompt('Reason for cancelling (sent to the customer):');
      if (!reason?.trim()) return;
    }
    setBusyId(appointment._id);
    setError(null);
    try {
      await apiRequest(`/provider/appointments/${appointment._id}/status`, { method: 'PATCH', token, body: { status, reason } });
      await load();
      onChanged?.();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {!compact && (
        <div className="flex gap-2 mb-4" role="group" aria-label="Show appointments">
          {[['upcoming', 'Upcoming'], ['past', 'Past & cancelled'], ['all', 'All']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              aria-pressed={scope === id}
              className={`btn-toggle ${scope === id ? 'btn-toggle-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p className="text-sm text-gray-500">No {scope === 'all' ? '' : scope} appointments.</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((a) => (
            <AppointmentRow key={a._id} appointment={a} onStatus={setStatus} busy={busyId === a._id} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ServicesView({ token, onChanged }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | service
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(
    () =>
      apiRequest('/provider/services', { token })
        .then(({ data }) => setServices(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const save = async (body) => {
    setSaving(true);
    setFormError(null);
    try {
      if (editing === 'new') {
        await apiRequest('/provider/services', { method: 'POST', token, body });
      } else {
        await apiRequest(`/provider/services/${editing._id}`, { method: 'PATCH', token, body });
      }
      setEditing(null);
      await load();
      onChanged?.();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (service, active) => {
    setError(null);
    try {
      await apiRequest(`/provider/services/${service._id}`, { method: 'PATCH', token, body: { active } });
      await load();
      onChanged?.();
    } catch (err) {
      setError(errorText(err));
    }
  };

  const remove = async (service) => {
    if (!window.confirm(`Remove "${service.name}"? Services with past bookings are hidden instead of deleted.`)) return;
    setError(null);
    try {
      await apiRequest(`/provider/services/${service._id}`, { method: 'DELETE', token });
      await load();
      onChanged?.();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-semibold text-lg text-gray-900">Your Services</h2>
        <button type="button" onClick={() => { setFormError(null); setEditing('new'); }} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add Service
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading services...</p>
      ) : services.length === 0 ? (
        <p className="text-sm text-gray-500">No services yet. Add one so customers can book you.</p>
      ) : (
        <ul className="space-y-3">
          {services.map((service) => {
            const Icon = service.type === 'vet' ? Stethoscope : Scissors;
            return (
              <li key={service._id} className={`flex flex-wrap items-start gap-4 p-4 border border-gray-100 rounded-xl ${service.active ? '' : 'opacity-60'}`}>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{service.name}</h3>
                    {!service.active && <span className="badge badge-neutral">Hidden</span>}
                  </div>
                  <p className="text-sm text-gray-500">
                    {service.durationMinutes} min • ${formatPriceCents(service.priceCents)} • {service.availableDays.map((d) => DAY_NAMES[d]).join(', ')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{service.timeSlots.join(' · ')}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setActive(service, !service.active)} className="text-sm font-medium text-gray-600 hover:text-primary px-2 py-1">
                    {service.active ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" onClick={() => { setFormError(null); setEditing(service); }} className="p-2 text-gray-400 hover:text-primary" aria-label={`Edit ${service.name}`}>
                    <Edit2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => remove(service)} className="p-2 text-gray-400 hover:text-red-600" aria-label={`Remove ${service.name}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <ServiceForm
          initial={
            editing === 'new'
              ? { ...DEFAULT_SERVICE, editingId: null }
              : {
                  editingId: editing._id,
                  name: editing.name,
                  description: editing.description ?? '',
                  type: editing.type,
                  durationMinutes: editing.durationMinutes,
                  price: (editing.priceCents / 100).toFixed(2),
                  timeSlots: editing.timeSlots,
                  availableDays: editing.availableDays,
                }
          }
          saving={saving}
          error={formError}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, iconClass }) {
  return (
    <div className="stat-card">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${iconClass}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

// Dashboard for vendors approved as service providers (vets, groomers):
// manage bookable services and the appointments customers make with them.
export default function ProviderDashboard() {
  const { user, token } = useAuth();
  const [view, setView] = useState('overview');
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(
    () => apiRequest('/provider/stats', { token }).then(({ data }) => setStats(data)).catch(() => {}),
    [token]
  );

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-dark text-white hidden md:block">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="font-heading font-bold text-xl tracking-wide text-white">Provider Portal</h2>
            <p className="text-sm text-gray-400">{user.businessName}</p>
          </div>
          <nav className="space-y-2" aria-label="Provider portal">
            {VIEWS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-current={view === id ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-left transition-colors ${
                  view === id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" /> {label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="md:hidden flex gap-2 mb-6 overflow-x-auto">
            {VIEWS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-current={view === id ? 'page' : undefined}
                className={`btn-toggle whitespace-nowrap ${view === id ? 'btn-toggle-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">{VIEWS.find((v) => v.id === view).label}</h1>

          {view === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard label="Upcoming" value={stats?.upcomingAppointments ?? '…'} icon={Calendar} iconClass="bg-blue-100 text-blue-600" />
                <StatCard label="Completed" value={stats?.completedAppointments ?? '…'} icon={CheckCircle2} iconClass="bg-green-100 text-green-600" />
                <StatCard label="Earnings" value={stats ? `$${formatPriceCents(stats.earningsCents)}` : '…'} icon={DollarSign} iconClass="bg-amber-100 text-amber-600" />
                <StatCard label="Active Services" value={stats?.activeServices ?? '…'} icon={Scissors} iconClass="bg-purple-100 text-purple-600" />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-heading font-semibold text-lg text-gray-900">Next Appointments</h2>
                  <button type="button" onClick={() => setView('appointments')} className="text-primary text-sm font-semibold hover:underline">
                    View all
                  </button>
                </div>
                <AppointmentsView token={token} limit={5} compact onChanged={loadStats} />
              </div>
            </>
          )}
          {view === 'appointments' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <AppointmentsView token={token} onChanged={loadStats} />
            </div>
          )}
          {view === 'services' && <ServicesView token={token} onChanged={loadStats} />}
        </div>
      </main>
    </div>
  );
}
