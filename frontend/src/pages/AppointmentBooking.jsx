import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Scissors, Stethoscope, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { formatPriceCents } from '../lib/format';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const [availability, setAvailability] = useState(null);
  const [availabilityError, setAvailabilityError] = useState(null);
  const [petDescription, setPetDescription] = useState('');
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
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

  useEffect(() => {
    if (!token) return;
    apiRequest('/pets', { token })
      .then(({ data }) => setPets(data))
      .catch(() => setPets([]));
  }, [token]);

  const handleSelectPet = (petId) => {
    setSelectedPetId(petId);
    const pet = pets.find((p) => p._id === petId);
    setPetDescription(pet ? [pet.name, pet.breed].filter(Boolean).join(' - ') : '');
  };

  // Free slots for the chosen service and date.
  useEffect(() => {
    if (!selectedService || !selectedDate) return;
    let active = true;
    apiRequest(`/services/${selectedService}/availability?date=${selectedDate}`)
      .then(({ data }) => active && setAvailability(data))
      .catch((err) => active && setAvailabilityError(err));
    return () => {
      active = false;
    };
  }, [selectedService, selectedDate]);

  const chooseService = (id) => {
    setSelectedService(id);
    setSelectedTime('');
    setAvailability(null);
    setAvailabilityError(null);
  };

  const chooseDate = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    setAvailability(null);
    setAvailabilityError(null);
  };

  const currentService = services.find((s) => s._id === selectedService);

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
          petId: selectedPetId || undefined,
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
            {service?.name} with {service?.providerName} is booked for {selectedDate} at {selectedTime}. A confirmation email is on its way.
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
                      onClick={() => chooseService(srv._id)}
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
                      <p className="text-xs text-gray-400">
                        {srv.providerName} · {srv.durationMinutes} min · ${formatPriceCents(srv.priceCents)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{srv.availableDays.map((d) => DAY_NAMES[d]).join(', ')}</p>
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
                  onChange={(e) => chooseDate(e.target.value)}
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" /> Available Time Slots
                </span>
                {!selectedService || !selectedDate ? (
                  <p className="text-sm text-gray-500">Choose a service and date to see open times.</p>
                ) : availabilityError ? (
                  <p className="text-sm text-red-600" role="alert">Couldn&apos;t load times: {availabilityError.message}</p>
                ) : !availability ? (
                  <p className="text-sm text-gray-500">Checking availability...</p>
                ) : !availability.open ? (
                  <p className="text-sm text-gray-500">
                    {currentService?.providerName} isn&apos;t open on this day. Available:{' '}
                    {currentService?.availableDays.map((d) => DAY_NAMES[d]).join(', ')}.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availability.slots.map(({ label, available, reason }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setSelectedTime(label)}
                        disabled={!available}
                        aria-pressed={selectedTime === label}
                        title={reason === 'booked' ? 'Already booked' : reason === 'past' ? 'Time has passed' : undefined}
                        className={`btn-toggle ${selectedTime === label ? 'btn-toggle-active' : ''} disabled:opacity-40 disabled:cursor-not-allowed disabled:line-through`}
                      >
                        {label}
                      </button>
                    ))}
                    {availability.slots.every((slot) => !slot.available) && (
                      <p className="text-sm text-gray-500 w-full">No open times left on this day — try another date.</p>
                    )}
                  </div>
                )}
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
              {pets.length > 0 && (
                <div>
                  <label htmlFor="appointment-pet-select" className="block text-sm font-medium text-gray-700 mb-1">Choose one of your pets</label>
                  <select
                    id="appointment-pet-select"
                    className="input-field"
                    value={selectedPetId}
                    onChange={(e) => handleSelectPet(e.target.value)}
                  >
                    <option value="">Other / not listed</option>
                    {pets.map((pet) => (
                      <option key={pet._id} value={pet._id}>
                        {pet.name}{pet.breed ? ` (${pet.breed})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!selectedPetId && (
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
              )}
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
