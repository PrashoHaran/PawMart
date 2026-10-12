import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const DAYS = [
  [1, 'Mon'],
  [2, 'Tue'],
  [3, 'Wed'],
  [4, 'Thu'],
  [5, 'Fri'],
  [6, 'Sat'],
  [0, 'Sun'],
];

// "14:30" (from <input type="time">) -> "02:30 PM"
function toSlotLabel(time) {
  const [h, m] = time.split(':').map(Number);
  const meridiem = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${meridiem}`;
}

function slotMinutes(label) {
  const [, h, m, mer] = label.match(/^(\d{2}):(\d{2}) (AM|PM)$/);
  return ((Number(h) % 12) + (mer === 'PM' ? 12 : 0)) * 60 + Number(m);
}

export default function ServiceForm({ initial, saving, error, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);
  const [newSlot, setNewSlot] = useState('');
  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleDay = (day) =>
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));

  const addSlot = () => {
    if (!newSlot) return;
    const label = toSlotLabel(newSlot);
    setForm((prev) =>
      prev.timeSlots.includes(label)
        ? prev
        : { ...prev, timeSlots: [...prev.timeSlots, label].sort((a, b) => slotMinutes(a) - slotMinutes(b)) }
    );
    setNewSlot('');
  };

  const removeSlot = (label) => setForm((prev) => ({ ...prev, timeSlots: prev.timeSlots.filter((s) => s !== label) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      description: form.description,
      type: form.type,
      durationMinutes: Number(form.durationMinutes),
      priceCents: Math.round(Number(form.price) * 100),
      timeSlots: form.timeSlots,
      availableDays: form.availableDays,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="service-form-title">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 id="service-form-title" className="text-xl font-bold text-gray-900">{initial.editingId ? 'Edit Service' : 'Add Service'}</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="service-name" className="block text-sm font-medium text-gray-700 mb-1">Service name</label>
            <input id="service-name" required maxLength={100} className="input-field" value={form.name} onChange={update('name')} />
          </div>
          <div>
            <label htmlFor="service-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="service-description" maxLength={500} className="input-field min-h-[70px]" value={form.description} onChange={update('description')} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="service-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select id="service-type" className="input-field" value={form.type} onChange={update('type')}>
                <option value="grooming">Grooming</option>
                <option value="vet">Veterinary</option>
              </select>
            </div>
            <div>
              <label htmlFor="service-duration" className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
              <input id="service-duration" type="number" required min="5" max="480" className="input-field" value={form.durationMinutes} onChange={update('durationMinutes')} />
            </div>
            <div>
              <label htmlFor="service-price" className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input id="service-price" type="number" required min="0" step="0.01" className="input-field" value={form.price} onChange={update('price')} />
            </div>
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">Open on</legend>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(([day, label]) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  aria-pressed={form.availableDays.includes(day)}
                  className={`btn-toggle !px-3 ${form.availableDays.includes(day) ? 'btn-toggle-active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">Appointment start times</legend>
            <ul className="flex flex-wrap gap-2 mb-3">
              {form.timeSlots.map((label) => (
                <li key={label} className="badge badge-info !text-sm">
                  {label}
                  <button type="button" onClick={() => removeSlot(label)} aria-label={`Remove ${label}`} className="hover:text-red-600">
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <label htmlFor="service-new-slot" className="sr-only">New start time</label>
              <input id="service-new-slot" type="time" className="input-field !w-auto" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} />
              <button type="button" onClick={addSlot} disabled={!newSlot} className="btn-outline flex items-center gap-1 disabled:opacity-50">
                <Plus className="h-4 w-4" aria-hidden="true" /> Add time
              </button>
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={saving || form.timeSlots.length === 0 || form.availableDays.length === 0}
            className="btn-primary w-full disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Service'}
          </button>
        </form>
      </div>
    </div>
  );
}
