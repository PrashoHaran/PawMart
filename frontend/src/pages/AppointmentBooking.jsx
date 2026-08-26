import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Scissors, Stethoscope, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { formatPriceCents } from '../lib/format';

const TIME_SLOTS = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];

const SERVICE_STYLE = {
  vet: { icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-100' },
  grooming: { icon: Scissors, color: 'text-purple-500', bg: 'bg-purple-100' },
};

export default function AppointmentBooking() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);

  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [petDescription, setPetDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  useEffect(() => {
    apiRequest('/services')
      .then(({ data }) => setServices(data))
      .catch((err) => setServicesError(err))
      .finally(() => setServicesLoading(false));
  }, []);

  const canConfirm = selectedService && selectedDate && selectedTime && petDescription;

  const handleConfirm = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setConfirming(true);
    setConfirmError(null);
    try {
      const { data } = await apiRequest('/appointments', {
        method: 'POST',
        token,
        body: {
          serviceId: selectedService,
          date: selectedDate,
          timeSlotLabel: selectedTime,
          petDescription,
          notes,
        },
      });
      setConfirmedAppointment(data);
    } catch (err) {
      setConfirmError(err);
    } finally {
      setConfirming(false);
    }
  };

  if (confirmedAppointment) {
    const service = services.find((s) => s._id === selectedService);
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Appointment Confirmed!</h1>
          <p className="text-gray-500">
            {service?.name} booked for {selectedDate} at {selectedTime}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Book an Appointment</h1>
          <p className="text-gray-600">Schedule clinical visits or grooming services directly with our partners.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

          {/* Step 1: Service Selection */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="step-circle step-circle-active !h-6 !w-6 !text-xs">1</span>
              Select Service
            </h2>
            {servicesError && (
              <div className="alert alert-warning" role="alert">
                <p className="text-sm text-orange-700">Couldn't load services: {servicesError.message}</p>
              </div>
            )}
            {servicesLoading ? (
              <p className="text-gray-500">Loading services...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((srv) => {
                  const style = SERVICE_STYLE[srv.type] || SERVICE_STYLE.vet;
                  const Icon = style.icon;
                  return (
                    <button
                      key={srv._id}
                      onClick={() => setSelectedService(srv._id)}
                      aria-pressed={selectedService === srv._id}
                      className={`p-4 rounded-xl border-2 text-left transition-colors ${selectedService === srv._id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${style.bg} ${style.color}`}>
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <span className="font-bold text-gray-900">{srv.name}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{srv.description}</p>
                      <p className="text-xs text-gray-400">{srv.durationMinutes} min · ${formatPriceCents(srv.priceCents)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Date & Time */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="step-circle step-circle-active !h-6 !w-6 !text-xs">2</span>
              Select Date & Time
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label htmlFor="appointment-date" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" /> Choose Date
                </label>
                <input
                  id="appointment-date"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  className="input-field"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" /> Available Time Slots
                </span>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      aria-pressed={selectedTime === time}
                      className={`btn-toggle ${selectedTime === time ? 'btn-toggle-active' : ''}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Pet Details */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="step-circle step-circle-active !h-6 !w-6 !text-xs">3</span>
              Pet Details
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="appointment-pet" className="block text-sm font-medium text-gray-700 mb-1">Pet Name & Description</label>
                <input
                  id="appointment-pet"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Bella - Golden Retriever"
                  value={petDescription}
                  onChange={(e) => setPetDescription(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="appointment-notes" className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit / Notes</label>
                <textarea
                  id="appointment-notes"
                  className="input-field min-h-[80px]"
                  placeholder="Briefly describe the reason for your visit..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          {confirmError && (
            <div className="alert alert-warning mb-6" role="alert">
              <p className="text-sm text-orange-700">{confirmError.message}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-8 flex justify-end">
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || confirming}
              className="btn-primary py-3 px-8 text-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? 'Booking...' : 'Confirm Booking'} <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
