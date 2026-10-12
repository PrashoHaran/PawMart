import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Syringe, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { formatDate, toDateInputValue } from '../../lib/format';
import { VACCINE_STATUS } from './status';

const EMPTY_VACCINATION = { name: '', dateGiven: '', nextDueDate: '', vetName: '', notes: '' };

function errorText(err) {
  return err.details?.[0] ? err.details[0].message : err.message;
}

function VaccinationForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ ...form, nextDueDate: form.nextDueDate || null });
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label htmlFor="vaccine-name" className="block text-sm font-medium text-gray-700 mb-1">Vaccine</label>
          <input id="vaccine-name" required maxLength={100} className="input-field" placeholder="e.g. Rabies" value={form.name} onChange={update('name')} />
        </div>
        <div>
          <label htmlFor="vaccine-date-given" className="block text-sm font-medium text-gray-700 mb-1">Date given</label>
          <input id="vaccine-date-given" type="date" required className="input-field" value={form.dateGiven} onChange={update('dateGiven')} />
        </div>
        <div>
          <label htmlFor="vaccine-next-due" className="block text-sm font-medium text-gray-700 mb-1">Next due</label>
          <input id="vaccine-next-due" type="date" min={form.dateGiven || undefined} className="input-field" value={form.nextDueDate} onChange={update('nextDueDate')} />
        </div>
        <div>
          <label htmlFor="vaccine-vet" className="block text-sm font-medium text-gray-700 mb-1">Vet / clinic</label>
          <input id="vaccine-vet" maxLength={100} className="input-field" value={form.vetName} onChange={update('vetName')} />
        </div>
        <div>
          <label htmlFor="vaccine-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input id="vaccine-notes" maxLength={500} className="input-field" value={form.notes} onChange={update('notes')} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>
      </div>
    </form>
  );
}

function HealthNotesForm({ record, onSave }) {
  const [conditions, setConditions] = useState(record.conditions.join(', '));
  const [medicalNotes, setMedicalNotes] = useState(record.medicalNotes);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await onSave({
        conditions: conditions.split(',').map((c) => c.trim()).filter(Boolean),
        medicalNotes,
      });
      setStatus({ ok: true, text: 'Saved.' });
    } catch (err) {
      setStatus({ ok: false, text: errorText(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="health-conditions" className="block text-sm font-medium text-gray-700 mb-1">
          Medical conditions <span className="text-gray-400 font-normal">(comma separated)</span>
        </label>
        <input id="health-conditions" className="input-field" placeholder="e.g. Hip dysplasia" value={conditions} onChange={(e) => setConditions(e.target.value)} />
      </div>
      <div>
        <label htmlFor="health-notes" className="block text-sm font-medium text-gray-700 mb-1">Medical notes</label>
        <textarea id="health-notes" maxLength={2000} className="input-field min-h-[80px]" value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save Health Notes'}</button>
        {status && (
          <span className={`text-sm ${status.ok ? 'text-green-600' : 'text-red-600'}`} role="status">{status.text}</span>
        )}
      </div>
    </form>
  );
}

export default function PetHealthPanel({ petId, onChanged }) {
  const { token } = useAuth();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | vaccination _id

  useEffect(() => {
    const controller = new AbortController();
    apiRequest(`/pets/${petId}`, { token, signal: controller.signal })
      .then(({ data }) => setRecord(data.healthRecord))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      });
    return () => controller.abort();
  }, [petId, token]);

  const mutate = useCallback(
    async (path, method, body) => {
      const { data } = await apiRequest(`/pets/${petId}${path}`, { method, token, body });
      setRecord(data);
      setEditing(null);
      onChanged();
    },
    [petId, token, onChanged]
  );

  const handleDelete = async (vaccination) => {
    if (!window.confirm(`Delete the ${vaccination.name} record?`)) return;
    try {
      await mutate(`/vaccinations/${vaccination._id}`, 'DELETE');
    } catch (err) {
      window.alert(`Couldn't delete: ${err.message}`);
    }
  };

  if (error) {
    return <p className="text-sm text-red-600" role="alert">Couldn&apos;t load health record: {error.message}</p>;
  }
  if (!record) {
    return <p className="text-sm text-gray-500">Loading health record...</p>;
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="vaccinations-heading">
        <div className="flex items-center justify-between mb-4">
          <h3 id="vaccinations-heading" className="font-heading font-semibold text-gray-900 flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" aria-hidden="true" /> Vaccinations
          </h3>
          {editing === null && (
            <button type="button" onClick={() => setEditing('new')} className="text-primary hover:text-primary-dark text-sm font-semibold flex items-center gap-1">
              <Plus className="h-4 w-4" aria-hidden="true" /> Add Vaccination
            </button>
          )}
        </div>

        {editing === 'new' && (
          <div className="mb-4">
            <VaccinationForm
              initial={EMPTY_VACCINATION}
              onSubmit={(body) => mutate('/vaccinations', 'POST', body)}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        {record.vaccinations.length === 0 && editing !== 'new' ? (
          <p className="text-sm text-gray-500">No vaccinations recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {record.vaccinations.map((v) =>
              editing === v._id ? (
                <li key={v._id}>
                  <VaccinationForm
                    initial={{
                      name: v.name,
                      dateGiven: toDateInputValue(v.dateGiven),
                      nextDueDate: toDateInputValue(v.nextDueDate),
                      vetName: v.vetName,
                      notes: v.notes,
                    }}
                    onSubmit={(body) => mutate(`/vaccinations/${v._id}`, 'PUT', body)}
                    onCancel={() => setEditing(null)}
                  />
                </li>
              ) : (
                <li key={v._id} className={`flex items-start gap-4 p-4 border border-gray-100 rounded-xl ${v.status === 'superseded' ? 'opacity-60' : ''}`}>
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{v.name}</span>
                      {v.status === 'superseded' ? (
                        <span className="badge badge-neutral">Earlier dose</span>
                      ) : v.nextDueDate ? (
                        <span className={`badge ${VACCINE_STATUS[v.status].className}`}>{VACCINE_STATUS[v.status].label}</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-500">
                      Given {formatDate(v.dateGiven)}
                      {v.nextDueDate && ` • Next due ${formatDate(v.nextDueDate)}`}
                      {v.vetName && ` • ${v.vetName}`}
                    </p>
                    {v.notes && <p className="text-sm text-gray-600 mt-1">{v.notes}</p>}
                  </div>
                  {editing === null && (
                    <div className="flex shrink-0">
                      <button type="button" onClick={() => setEditing(v._id)} className="p-2 text-gray-400 hover:text-primary rounded-lg" aria-label={`Edit ${v.name} record`}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => handleDelete(v)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg" aria-label={`Delete ${v.name} record`}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </li>
              )
            )}
          </ul>
        )}
      </section>

      <section aria-labelledby="health-notes-heading">
        <h3 id="health-notes-heading" className="font-heading font-semibold text-gray-900 mb-4">Health Notes</h3>
        <HealthNotesForm record={record} onSave={(body) => mutate('/health', 'PATCH', body)} />
      </section>
    </div>
  );
}
