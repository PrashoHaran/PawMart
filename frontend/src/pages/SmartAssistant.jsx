import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Bot,
  CheckCircle2,
  ExternalLink,
  HeartPulse,
  Scissors,
  Sparkles,
  Stethoscope,
  Sun,
  Utensils,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { formatPriceCents } from '../lib/format';
import { handleImageError, optimizedImage } from '../lib/image';

const ACTIVITY = [
  ['Low', 'Low', 'Mostly resting, short walks'],
  ['Moderate', 'Moderate', 'Daily walks or play'],
  ['High', 'High', 'Very active, working or sport'],
];
const NEUTERED = [
  ['yes', 'Yes'],
  ['no', 'No'],
  ['unsure', 'Not sure'],
];
const STAGE_LABELS = { puppy: 'Puppy', kitten: 'Kitten', adult: 'Adult', senior: 'Senior' };
const SIZE_LABELS = { toy: 'Toy', small: 'Small', medium: 'Medium', large: 'Large', giant: 'Giant', variable: 'Size varies' };

function ageFromBirthDate(birthDate) {
  if (!birthDate) return '';
  const years = (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return String(Math.max(0, Math.round(years * 10) / 10));
}

function Segmented({ label, options, value, onChange, describe }) {
  const id = useId();
  return (
    <fieldset>
      <legend id={id} className="block text-sm font-medium text-gray-700 mb-2">{label}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map(([optionValue, optionLabel, hint]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-pressed={value === optionValue}
            title={describe ? hint : undefined}
            className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
              value === optionValue ? 'border-primary bg-primary/5 text-primary-dark' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function StatTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" /> {label}
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// Healthy-range meter: gray track, the breed's healthy band, and a marker for
// the pet's weight. Status is also stated in words, never colour alone.
function WeightMeter({ weight }) {
  const { min, max, current, status } = weight;
  const lo = Math.min(min * 0.6, current * 0.95);
  const hi = Math.max(max * 1.4, current * 1.05);
  const pct = (v) => ((v - lo) / (hi - lo)) * 100;
  const state = {
    within: { text: 'Within the healthy range', className: 'text-green-700', icon: CheckCircle2 },
    over: { text: 'Above the healthy range', className: 'text-amber-700', icon: AlertTriangle },
    under: { text: 'Below the healthy range', className: 'text-amber-700', icon: AlertTriangle },
  }[status];
  const StateIcon = state.icon;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h3 className="font-semibold text-gray-900">Weight</h3>
        <p className={`text-sm font-medium flex items-center gap-1.5 ${state.className}`}>
          <StateIcon className="h-4 w-4" aria-hidden="true" /> {state.text}
        </p>
      </div>
      <div className="relative h-3 rounded-full bg-gray-100" role="img" aria-label={`${current} kg; healthy range for the breed is ${min} to ${max} kg`}>
        <div className="absolute inset-y-0 rounded-full bg-primary/25" style={{ left: `${pct(min)}%`, width: `${pct(max) - pct(min)}%` }} />
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-white shadow"
          style={{ left: `${pct(current)}%` }}
        />
      </div>
      <div className="relative h-5 mt-2 text-xs text-gray-500 tabular-nums" aria-hidden="true">
        <span className="absolute -translate-x-1/2" style={{ left: `${pct(min)}%` }}>{min} kg</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${pct(max)}%` }}>{max} kg</span>
      </div>
      <p className="text-sm text-gray-600 mt-1">
        Your pet: <span className="font-semibold text-gray-900">{current} kg</span> · typical adult range {min}–{max} kg
      </p>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 font-heading font-semibold text-lg text-gray-900 mb-3">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" /> {title}
      </h3>
      {children}
    </section>
  );
}

function CarePlan({ plan, petName }) {
  const { breed, feeding } = plan;
  const title = breed ? breed.name : plan.petType === 'dog' ? 'Your dog' : 'Your cat';

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <p className="text-sm text-gray-500 mb-1">Care plan{petName ? ` for ${petName}` : ''}</p>
        <h2 className="text-2xl font-heading font-bold text-gray-900">{title}</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="badge badge-info">{STAGE_LABELS[plan.lifeStage]}</span>
          <span className="badge badge-neutral">{SIZE_LABELS[breed?.size ?? plan.sizeCategory]}{breed?.size !== 'variable' ? ' breed' : ''}</span>
          {breed?.brachycephalic && <span className="badge badge-warning">Flat-faced breed</span>}
        </div>
        {!breed && plan.breedInput && (
          <p className="text-sm text-gray-600 mt-3">
            We don&apos;t have breed-specific advice for &ldquo;{plan.breedInput}&rdquo; yet, so this plan uses general {plan.petType} guidance.
            {plan.breedSuggestions.length > 0 && ` Breeds we cover: ${plan.breedSuggestions.join(', ')}.`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={Utensils} label="Daily calories" value={`${feeding.dailyKcal.toLocaleString()} kcal`} sub={`${feeding.factor}× resting energy`} />
        <StatTile icon={Activity} label="Meals per day" value={feeding.mealsPerDay} sub={`~${feeding.kcalPerMeal} kcal each`} />
        {breed && <StatTile icon={HeartPulse} label="Exercise" value={`${breed.exerciseMinutes[0]}–${breed.exerciseMinutes[1]}`} sub="minutes a day" />}
        {breed && <StatTile icon={Scissors} label="Grooming" value={breed.grooming.level} sub="coat care" />}
      </div>

      {plan.weight?.status && <WeightMeter weight={plan.weight} />}

      {breed?.heatNote && (
        <div className="alert alert-warning">
          <Sun className="h-5 w-5 text-orange-500 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-orange-800">Heat warning</h3>
            <p className="text-sm text-orange-700 mt-0.5">{breed.heatNote}</p>
          </div>
        </div>
      )}

      <Section icon={Utensils} title="Feeding">
        <ul className="space-y-2 text-gray-700">
          {feeding.notes.map((note) => (
            <li key={note} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </Section>

      {breed && (
        <Section icon={Sparkles} title={`Caring for a ${breed.name.split(' / ')[0]}`}>
          <ul className="space-y-2 text-gray-700">
            {[breed.grooming.note, ...breed.careTips].map((tip) => (
              <li key={tip} className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {breed?.watchFor.length > 0 && (
        <Section icon={Stethoscope} title="Health to ask your vet about">
          <div className="grid gap-3 sm:grid-cols-2">
            {breed.watchFor.map((item) => (
              <div key={item.condition} className="rounded-2xl border border-gray-100 bg-white p-4">
                <h4 className="font-semibold text-gray-900 mb-1">{item.condition}</h4>
                <p className="text-sm text-gray-600">{item.detail}</p>
                {item.source && (
                  <a href={item.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                    Source <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">: {item.source.label} (opens in a new tab)</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section icon={Bot} title="Suggested for your pet">
        {plan.recommendedProducts.length === 0 ? (
          <p className="text-sm text-gray-500">No suitable products in stock right now.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {plan.recommendedProducts.map((product) => (
              <Link key={product._id} to={`/product/${product._id}`} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-3 hover:border-primary/40 hover:shadow-sm transition">
                <img src={optimizedImage(product.image, 128)} alt="" loading="lazy" onError={handleImageError} className="h-16 w-16 rounded-xl object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</p>
                  <p className="text-xs text-primary-dark mt-0.5">{product.reason}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">${formatPriceCents(product.priceCents)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <details className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
        <summary className="cursor-pointer font-medium text-gray-700 flex items-center gap-2">
          <BookOpen className="h-4 w-4" aria-hidden="true" /> How this plan is calculated
        </summary>
        <p className="mt-3">
          Daily calories = resting energy (70 × {feeding.feedForKg} kg<sup>0.75</sup>) × {feeding.factor} ({feeding.basis}), using the life-stage
          factors in the Merck Veterinary Manual. Breed advice comes from PawMart&apos;s rule set, based on the sources below.
        </p>
        <ul className="mt-3 space-y-1">
          {plan.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export default function SmartAssistant() {
  const { token } = useAuth();
  const [petType, setPetType] = useState('dog');
  const [breed, setBreed] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [neutered, setNeutered] = useState('unsure');
  const [activityLevel, setActivityLevel] = useState('Moderate');
  const [allergies, setAllergies] = useState('');
  const [petName, setPetName] = useState('');

  const [breeds, setBreeds] = useState([]);
  const [savedPets, setSavedPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const resultsRef = useRef(null);
  const ageInputRef = useRef(null);
  const [missingAgeFor, setMissingAgeFor] = useState('');

  useEffect(() => {
    apiRequest('/pet-assistant/breeds')
      .then(({ data }) => setBreeds(data))
      .catch(() => setBreeds([]));
  }, []);

  useEffect(() => {
    if (!token) return;
    apiRequest('/pets', { token })
      .then(({ data }) => setSavedPets(data.filter((p) => p.species === 'dog' || p.species === 'cat')))
      .catch(() => setSavedPets([]));
  }, [token]);

  const applySavedPet = (pet) => {
    setPetType(pet.species);
    setBreed(pet.breed ?? '');
    setAgeYears(ageFromBirthDate(pet.birthDate));
    setWeightKg(pet.weightKg != null ? String(pet.weightKg) : '');
    setAllergies(pet.allergies?.join(', ') ?? '');
    setPetName(pet.name);
    // No birth date saved: ask for the age instead of silently disabling the button.
    setMissingAgeFor(pet.birthDate ? '' : pet.name);
    if (!pet.birthDate) requestAnimationFrame(() => ageInputRef.current?.focus());
  };

  const canSubmit = ageYears !== '' && Number(weightKg) > 0 && !loading;

  const generate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiRequest('/pet-assistant/recommend', {
        method: 'POST',
        body: { petType, breed, ageYears: Number(ageYears), weightKg: Number(weightKg), activityLevel, neutered, allergies },
      });
      setPlan(data);
      // On small screens the plan renders below the form.
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (err) {
      setError(err.details?.[0] ? `${err.details[0].field}: ${err.details[0].message}` : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Bot className="h-8 w-8" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Smart Pet Care Assistant</h1>
            <p className="text-gray-600">Feeding, breed-specific care and product picks for your dog or cat.</p>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr] items-start">
          {/* Form */}
          <form onSubmit={generate} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5 lg:sticky lg:top-24">
            {savedPets.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Use a saved pet</p>
                <div className="flex flex-wrap gap-2">
                  {savedPets.map((pet) => (
                    <button
                      key={pet._id}
                      type="button"
                      onClick={() => applySavedPet(pet)}
                      aria-pressed={petName === pet.name}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        petName === pet.name ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-700 hover:border-primary/50'
                      }`}
                    >
                      {pet.species === 'dog' ? '🐶' : '🐱'} {pet.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Segmented
              label="Pet"
              options={[['dog', '🐶 Dog'], ['cat', '🐱 Cat']]}
              value={petType}
              onChange={(value) => {
                setPetType(value);
                setPetName('');
              }}
            />

            <div>
              <label htmlFor="assistant-breed" className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <input
                id="assistant-breed"
                list="assistant-breed-options"
                className="input-field"
                placeholder={petType === 'dog' ? 'e.g. Labrador, German Shepherd, local' : 'e.g. Persian, Siamese, mixed'}
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                autoComplete="off"
              />
              <datalist id="assistant-breed-options">
                {breeds.filter((b) => b.species === petType).map((b) => (
                  <option key={b.id} value={b.name} />
                ))}
              </datalist>
              <p className="text-xs text-gray-500 mt-1">Leave blank or type &ldquo;mixed&rdquo; if you&apos;re not sure.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="assistant-age" className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
                <input ref={ageInputRef} id="assistant-age" type="number" required aria-describedby={missingAgeFor ? 'assistant-age-hint' : undefined} min="0" max="40" step="0.1" inputMode="decimal" className="input-field" placeholder="3" value={ageYears} onChange={(e) => {
                    setAgeYears(e.target.value);
                    setMissingAgeFor('');
                  }} />
                {missingAgeFor && (
                  <p id="assistant-age-hint" className="text-xs text-amber-700 mt-1">Add {missingAgeFor}&apos;s age to continue.</p>
                )}
              </div>
              <div>
                <label htmlFor="assistant-weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input id="assistant-weight" type="number" required min="0.1" max="150" step="0.1" inputMode="decimal" className="input-field" placeholder={petType === 'dog' ? '25' : '4.5'} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
              </div>
            </div>

            <Segmented label="Spayed / neutered?" options={NEUTERED} value={neutered} onChange={setNeutered} />

            <div>
              <Segmented label="Activity level" options={ACTIVITY} value={activityLevel} onChange={setActivityLevel} describe />
              <p className="text-xs text-gray-500 mt-1">{ACTIVITY.find(([v]) => v === activityLevel)[2]}</p>
            </div>

            <div>
              <label htmlFor="assistant-allergies" className="block text-sm font-medium text-gray-700 mb-1">
                Allergies <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input id="assistant-allergies" className="input-field" placeholder="e.g. chicken, grain" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

            <button type="submit" disabled={!canSubmit} className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> {loading ? 'Creating plan...' : plan ? 'Update plan' : 'Create care plan'}
            </button>
          </form>

          {/* Results */}
          <div ref={resultsRef} className="scroll-mt-24 min-w-0" aria-live="polite">
            {plan ? (
              <CarePlan plan={plan} petName={petName} />
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-500">
                <Sparkles className="h-10 w-10 mx-auto text-primary/60 mb-3" aria-hidden="true" />
                <p className="font-medium text-gray-700">Your pet&apos;s care plan will appear here</p>
                <p className="text-sm mt-1">Daily calories, breed care tips, health watch-outs and product picks.</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          General husbandry guidance only — not a veterinary diagnosis. Always follow your vet&apos;s advice.
        </p>
      </div>
    </div>
  );
}
