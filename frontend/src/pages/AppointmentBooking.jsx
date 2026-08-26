import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Scissors, Stethoscope, ChevronRight } from 'lucide-react';

export default function AppointmentBooking() {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const services = [
    { id: 'vet', name: 'Veterinary Checkup', icon: Stethoscope, desc: 'General health check, vaccinations, and consultations.', color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'grooming', name: 'Pet Grooming', icon: Scissors, desc: 'Bath, haircut, nail trimming, and styling.', color: 'text-purple-500', bg: 'bg-purple-100' },
  ];

  const timeSlots = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];

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
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">1</span>
              Select Service
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map(srv => {
                const Icon = srv.icon;
                return (
                  <button 
                    key={srv.id}
                    onClick={() => setSelectedService(srv.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedService === srv.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${srv.bg} ${srv.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-gray-900">{srv.name}</span>
                    </div>
                    <p className="text-sm text-gray-500">{srv.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Date & Time */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">2</span>
              Select Date & Time
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" /> Choose Date
                </label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" /> Available Time Slots
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map(time => (
                    <button 
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedTime === time ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-primary'}`}
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
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">3</span>
              Pet Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Pet</label>
                <select className="input-field">
                  <option value="">-- Choose a pet --</option>
                  <option value="bella">Bella (Golden Retriever)</option>
                  <option value="luna">Luna (Siamese Cat)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit / Notes</label>
                <textarea className="input-field min-h-[80px]" placeholder="Briefly describe the reason for your visit..."></textarea>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 flex justify-end">
            <button className="btn-primary py-3 px-8 text-lg flex items-center gap-2">
              Confirm Booking <ChevronRight className="h-5 w-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
