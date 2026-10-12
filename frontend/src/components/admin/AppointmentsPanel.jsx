import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import Pager from './Pager';
import { errorText, usePagedList } from './usePagedList';

const STATUS_BADGE = {
  booked: { label: 'Booked', className: 'badge-info' },
  completed: { label: 'Completed', className: 'badge-success' },
  no_show: { label: 'No-show', className: 'badge-warning' },
  cancelled: { label: 'Cancelled', className: 'badge-danger' },
};
const SCOPES = [
  ['upcoming', 'Upcoming'],
  ['needs_update', 'Needs outcome'],
  ['past', 'Past & cancelled'],
  ['all', 'All'],
];

// Every booking on the platform. Admins run PawMart Clinic's services and can
// step in on any provider's booking.
export default function AppointmentsPanel({ initialScope = 'upcoming' }) {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ scope: initialScope, owner: 'all' });
  const { items: appointments, page, pages, setPage, loading, error, reload, loadedAt } = usePagedList('/admin/appointments', filters);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const setStatus = async (appointment, status) => {
    let reason;
    if (status === 'cancelled') {
      reason = window.prompt('Reason for cancelling (emailed to the customer):');
      if (!reason?.trim()) return;
    }
    setBusyId(appointment._id);
    setActionError(null);
    try {
      await apiRequest(`/admin/appointments/${appointment._id}/status`, { method: 'PATCH', token, body: { status, reason } });
      await reload();
    } catch (err) {
      setActionError(errorText(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-wrap gap-3 justify-between mb-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show appointments">
          {SCOPES.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setFilters((prev) => ({ ...prev, scope: id }))} aria-pressed={filters.scope === id} className={`btn-toggle !py-1.5 ${filters.scope === id ? 'btn-toggle-active' : ''}`}>
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={filters.owner === 'clinic'} onChange={(e) => setFilters((prev) => ({ ...prev, owner: e.target.checked ? 'clinic' : 'all' }))} className="h-4 w-4 text-primary rounded" />
          PawMart Clinic only
        </label>
      </div>

      {(error || actionError) && <p className="text-sm text-red-600 mb-4" role="alert">{error || actionError}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p className="text-sm text-gray-500">No appointments here.</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((a) => {
            const when = new Date(a.scheduledAt);
            // Booked but already started: needs completed / no-show.
            const needsOutcome = a.status === 'booked' && when.getTime() <= loadedAt;
            const badge = needsOutcome ? { label: 'Needs outcome', className: 'badge-warning' } : STATUS_BADGE[a.status];
            return (
              <li key={a._id} className="flex flex-wrap gap-4 p-4 border border-gray-100 rounded-xl">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{a.service?.name}</h3>
                    <span className="text-sm text-gray-500">• {a.providerName}</span>
                    <span className={`badge ${badge.className}`}>{badge.label}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {when.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {a.timeSlotLabel}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {a.customer?.name} ({a.customer?.email}) • {a.petId ? a.petId.name : a.petDescription}
                  </p>
                  {a.cancelReason && <p className="text-sm text-red-600 mt-1">Cancelled{a.cancelledBy ? ` by ${a.cancelledBy}` : ''}: {a.cancelReason}</p>}
                </div>
                {a.status === 'booked' && (
                  <div className="flex flex-wrap gap-2 self-start">
                    {needsOutcome ? (
                      <>
                        <button type="button" disabled={busyId === a._id} onClick={() => setStatus(a, 'completed')} className="btn-primary text-sm disabled:opacity-50">Mark Completed</button>
                        <button type="button" disabled={busyId === a._id} onClick={() => setStatus(a, 'no_show')} className="btn-outline text-sm disabled:opacity-50">No-show</button>
                      </>
                    ) : (
                      <button type="button" disabled={busyId === a._id} onClick={() => setStatus(a, 'cancelled')} className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg disabled:opacity-50">
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Pager page={page} pages={pages} setPage={setPage} />
    </div>
  );
}
