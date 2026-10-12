import { useState } from 'react';
import { ArrowLeft, Heart, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { formatAge, formatDate } from '../../lib/format';
import { handleImageError, optimizedImage } from '../../lib/image';
import PetForm from './PetForm';
import PetHealthPanel from './PetHealthPanel';
import { SPECIES_LABELS, VACCINE_STATUS, petSubtitle } from './status';

export function PetAvatar({ pet, size = 'w-16 h-16' }) {
  if (pet.photoUrl) {
    return <img src={optimizedImage(pet.photoUrl, 200)} alt={pet.name} loading="lazy" onError={handleImageError} className={`${size} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${size} rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0`} aria-hidden="true">
      {pet.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function PetCard({ pet, onSelect }) {
  const status = VACCINE_STATUS[pet.vaccineSummary.status];
  return (
    <button
      type="button"
      onClick={() => onSelect(pet._id)}
      className="w-full text-left flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-primary/40 hover:bg-gray-50/50 transition-colors"
    >
      <PetAvatar pet={pet} />
      <div className="min-w-0">
        <h3 className="font-bold text-gray-900">{pet.name}</h3>
        <p className="text-sm text-gray-500">{petSubtitle(pet)}</p>
        {pet.vaccineSummary.nextDue && (
          <p className="text-xs text-gray-400 mt-1">
            Next: {pet.vaccineSummary.nextDue.name} on {formatDate(pet.vaccineSummary.nextDue.date)}
          </p>
        )}
      </div>
      <div className="ml-auto shrink-0">
        <span className={`badge ${status.className}`}>{status.label}</span>
      </div>
    </button>
  );
}

function PetDetail({ pet, onBack, onChanged, onDeleted }) {
  const { token } = useAuth();
  const [editing, setEditing] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${pet.name}'s profile and health record? This can't be undone.`)) return;
    try {
      await apiRequest(`/pets/${pet._id}`, { method: 'DELETE', token });
      onDeleted();
    } catch (err) {
      window.alert(`Couldn't delete: ${err.message}`);
    }
  };

  const facts = [
    ['Species', SPECIES_LABELS[pet.species]],
    ['Breed', pet.breed || '—'],
    ['Sex', pet.sex === 'unknown' ? '—' : pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1)],
    ['Birth date', pet.birthDate ? `${formatDate(pet.birthDate)} (${formatAge(pet.birthDate)})` : '—'],
    ['Weight', pet.weightKg != null ? `${pet.weightKg} kg` : '—'],
    ['Allergies', pet.allergies.length ? pet.allergies.join(', ') : 'None recorded'],
  ];

  return (
    <div>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All pets
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
          {editing ? (
            <PetForm
              pet={pet}
              onSaved={() => {
                setEditing(false);
                onChanged();
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <PetAvatar pet={pet} size="w-20 h-20" />
                <div>
                  <h2 className="text-2xl font-heading font-bold text-gray-900">{pet.name}</h2>
                  <p className="text-sm text-gray-500">{petSubtitle(pet)}</p>
                </div>
              </div>
              <dl className="space-y-3 mb-6">
                {facts.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 text-sm">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="text-gray-900 font-medium text-right">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditing(true)} className="btn-outline flex items-center gap-2">
                  <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                </button>
                <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 transition-colors">
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                </button>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <PetHealthPanel petId={pet._id} onChanged={onChanged} />
        </div>
      </div>
    </div>
  );
}

export default function PetsTab({ pets, selectedPetId, onSelectPet, onPetsChanged }) {
  const [adding, setAdding] = useState(false);
  const selectedPet = pets.find((p) => p._id === selectedPetId);

  if (selectedPet) {
    return (
      <PetDetail
        key={selectedPet._id}
        pet={selectedPet}
        onBack={() => onSelectPet(null)}
        onChanged={onPetsChanged}
        onDeleted={() => {
          onSelectPet(null);
          onPetsChanged();
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-semibold text-gray-900">My Pets</h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Pet
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
          <h3 className="font-heading font-semibold text-gray-900 mb-4">New pet</h3>
          <PetForm
            onSaved={(pet) => {
              setAdding(false);
              onPetsChanged();
              onSelectPet(pet._id);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {pets.length === 0 && !adding ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-500">No pets yet. Add your first pet to start tracking their health.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pets.map((pet) => (
            <PetCard key={pet._id} pet={pet} onSelect={onSelectPet} />
          ))}
        </div>
      )}
    </div>
  );
}
