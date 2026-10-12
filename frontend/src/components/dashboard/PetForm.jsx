import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { toDateInputValue } from '../../lib/format';
import { SPECIES_LABELS } from './status';
import ImageUploadField from '../ImageUploadField';

function splitList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function PetForm({ pet, onSaved, onCancel }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    name: pet?.name ?? '',
    species: pet?.species ?? 'dog',
    breed: pet?.breed ?? '',
    sex: pet?.sex ?? 'unknown',
    birthDate: toDateInputValue(pet?.birthDate),
    weightKg: pet?.weightKg ?? '',
    allergies: (pet?.allergies ?? []).join(', '),
    photoUrl: pet?.photoUrl ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        species: form.species,
        breed: form.breed,
        sex: form.sex,
        birthDate: form.birthDate || null,
        weightKg: form.weightKg === '' ? null : Number(form.weightKg),
        allergies: splitList(form.allergies),
        photoUrl: form.photoUrl,
      };
      const { data } = await apiRequest(pet ? `/pets/${pet._id}` : '/pets', {
        method: pet ? 'PATCH' : 'POST',
        token,
        body,
      });
      onSaved(data);
    } catch (err) {
      setError(err.details?.[0] ? `${err.details[0].field}: ${err.details[0].message}` : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pet-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input id="pet-name" required maxLength={60} className="input-field" value={form.name} onChange={update('name')} />
        </div>
        <div>
          <label htmlFor="pet-species" className="block text-sm font-medium text-gray-700 mb-1">Species</label>
          <select id="pet-species" className="input-field" value={form.species} onChange={update('species')}>
            {Object.entries(SPECIES_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pet-breed" className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
          <input id="pet-breed" maxLength={100} className="input-field" placeholder="e.g. Golden Retriever" value={form.breed} onChange={update('breed')} />
        </div>
        <div>
          <label htmlFor="pet-sex" className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
          <select id="pet-sex" className="input-field" value={form.sex} onChange={update('sex')}>
            <option value="unknown">Unknown</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label htmlFor="pet-birth-date" className="block text-sm font-medium text-gray-700 mb-1">Birth date</label>
          <input id="pet-birth-date" type="date" max={today} className="input-field" value={form.birthDate} onChange={update('birthDate')} />
        </div>
        <div>
          <label htmlFor="pet-weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
          <input id="pet-weight" type="number" min="0" max="500" step="0.1" className="input-field" value={form.weightKg} onChange={update('weightKg')} />
        </div>
      </div>
      <div>
        <label htmlFor="pet-allergies" className="block text-sm font-medium text-gray-700 mb-1">
          Allergies <span className="text-gray-400 font-normal">(comma separated)</span>
        </label>
        <input id="pet-allergies" className="input-field" placeholder="e.g. Chicken, Grain" value={form.allergies} onChange={update('allergies')} />
      </div>
      <ImageUploadField
        label="Photo (optional)"
        purpose="pet"
        value={form.photoUrl}
        onChange={(url) => setForm((prev) => ({ ...prev, photoUrl: url }))}
        onUploadingChange={setUploading}
      />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving || uploading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? 'Saving...' : pet ? 'Save Changes' : 'Add Pet'}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>
      </div>
    </form>
  );
}
