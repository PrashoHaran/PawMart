import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { formatPriceCents } from '../../lib/format';
import { isUpcoming } from './status';

const TYPE_LABELS = { vet: 'Medical', grooming: 'Grooming' };

export function AppointmentItem({ appointment, onCancel }) {
  const when = new Date(appointment.scheduledAt);
  const upcoming = isUpcoming(appointment);
  const petName = appointment.petId?.name;
  const statusBadge =
    appointment.status === 'cancelled'
      ? { label: 'Cancelled', className: 'badge-danger' }
      : upcoming
        ? { label: 'Confirmed', className: 'badge-success' }
        : { label: 'Completed', className: 'badge-neutral' };

  return (
    <li className={`flex gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50 ${appointment.status === 'cancelled' ? 'opacity-60' : ''}`}>
      <div className="flex flex-col items-center justify-center min-w-[60px] bg-white rounded-lg shadow-sm p-2 text-primary font-bold">
        <span className="text-xs uppercase text-gray-500 mb-1">{when.toLocaleDateString(undefined, { month: 'short' })}</span>
        <span className="text-xl">{when.getDate()}</span>
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="font-bold text-gray-900">
          {appointment.service?.name ?? 'Service'} – {petName ?? appointment.petDescription}
        </h4>
        <p className="text-sm text-gray-500 mb-2">
          {when.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric' })} • {appointment.timeSlotLabel}
          {appointment.service && ` • $${formatPriceCents(appointment.service.priceCents)}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {appointment.service && <span className="badge badge-info">{TYPE_LABELS[appointment.service.type]}</span>}
          <span className={`badge ${statusBadge.className}`}>{statusBadge.label}</span>
        </div>
        {appointment.notes && <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>}
      </div>
      {upcoming && onCancel && (
        <button type="button" onClick={() => onCancel(appointment)} className="self-start text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
          Cancel
        </button>
      )}
    </li>
  );
}

export default function AppointmentsTab({ appointments, onAppointmentsChanged }) {
  const { token } = useAuth();
  const [error, setError] = useState(null);

  const upcoming = appointments.filter(isUpcoming).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const past = appointments.filter((a) => !isUpcoming(a));

  const handleCancel = async (appointment) => {
    if (!window.confirm(`Cancel ${appointment.service?.name ?? 'this appointment'} on ${new Date(appointment.scheduledAt).toLocaleDateString()}?`)) return;
    setError(null);
    try {
      await apiRequest(`/appointments/${appointment._id}/cancel`, { method: 'PATCH', token });
      onAppointmentsChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-semibold text-gray-900">Upcoming</h2>
          <Link to="/book-appointment" className="btn-primary">Book New</Link>
        </div>
        {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}
        {upcoming.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-500">No upcoming appointments.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {upcoming.map((a) => (
              <AppointmentItem key={a._id} appointment={a} onCancel={handleCancel} />
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-6">Past &amp; Cancelled</h2>
          <ul className="space-y-4">
            {past.map((a) => (
              <AppointmentItem key={a._id} appointment={a} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
