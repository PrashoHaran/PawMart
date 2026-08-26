import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, ChevronRight, Activity, Info } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { formatPriceCents } from '../lib/format';

export default function SmartAssistant() {
  const [step, setStep] = useState(1);
  const [petType, setPetType] = useState('');
  const [breed, setBreed] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [allergies, setAllergies] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiRequest('/pet-assistant/recommend', {
        method: 'POST',
        body: { petType, breed, ageYears: Number(ageYears), weightKg: Number(weightKg), activityLevel, allergies },
      });
      setResult(data);
      setStep(3);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Bot className="h-10 w-10 text-blue-600" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">Smart Pet Care Assistant</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get personalized feeding strategies, breed-specific care advice, and product recommendations tailored to your pet's unique needs.
          </p>
        </div>

        {/* Assistant Interface */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">

            {/* Progress Sidebar */}
            <div className="w-full md:w-64 bg-gray-50 p-8 border-b md:border-b-0 md:border-r border-gray-100">
              <nav className="space-y-6" aria-label="Progress">
                {[{ n: 1, label: 'Pet Profile' }, { n: 2, label: 'Health Status' }, { n: 3, label: 'Recommendations' }].map(({ n, label }) => (
                  <div key={n} className={`flex items-center gap-3 ${step >= n ? 'text-primary' : 'text-gray-400'}`} aria-current={step === n ? 'step' : undefined}>
                    <div className={`step-circle ${step >= n ? 'step-circle-active' : ''}`}>{n}</div>
                    <span className="font-medium">{label}</span>
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 md:p-12">
              {step === 1 && (
                <div className="animate-fade-in-up">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell us about your pet</h2>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                      onClick={() => setPetType('dog')}
                      aria-pressed={petType === 'dog'}
                      className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-colors ${petType === 'dog' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}
                    >
                      <span className="text-4xl" aria-hidden="true">🐶</span>
                      <span className="font-bold text-gray-900">Dog</span>
                    </button>
                    <button
                      onClick={() => setPetType('cat')}
                      aria-pressed={petType === 'cat'}
                      className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-colors ${petType === 'cat' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}
                    >
                      <span className="text-4xl" aria-hidden="true">🐱</span>
                      <span className="font-bold text-gray-900">Cat</span>
                    </button>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div>
                      <label htmlFor="pet-breed" className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                      <input id="pet-breed" type="text" className="input-field" placeholder="e.g. Golden Retriever" value={breed} onChange={(e) => setBreed(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="pet-age" className="block text-sm font-medium text-gray-700 mb-1">Age (Years)</label>
                        <input id="pet-age" type="number" min="0" step="0.5" className="input-field" placeholder="3" value={ageYears} onChange={(e) => setAgeYears(e.target.value)} />
                      </div>
                      <div>
                        <label htmlFor="pet-weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input id="pet-weight" type="number" min="0" step="0.1" className="input-field" placeholder="25" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!petType || !ageYears || !weightKg}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade-in-up">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Health & Lifestyle</h2>

                  <div className="space-y-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Activity Level</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Low', 'Moderate', 'High'].map(level => (
                          <button
                            key={level}
                            onClick={() => setActivityLevel(level)}
                            aria-pressed={activityLevel === level}
                            className={`btn-toggle ${activityLevel === level ? 'btn-toggle-active' : ''}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="pet-allergies" className="block text-sm font-medium text-gray-700 mb-3">Known Allergies / Sensitivities</label>
                      <textarea id="pet-allergies" className="input-field min-h-[100px]" placeholder="List any known allergies (e.g. Chicken, Grain)" value={allergies} onChange={(e) => setAllergies(e.target.value)}></textarea>
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-warning mb-6" role="alert">
                      <p className="text-sm text-orange-700">{error.message}</p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button onClick={() => setStep(1)} className="btn-outline">Back</button>
                    <button
                      onClick={generatePlan}
                      disabled={!activityLevel || loading}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Generating...' : 'Generate Plan'} <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && result && (
                <div className="animate-fade-in-up">
                  <div className="alert alert-success text-green-700 mb-8">
                    <Sparkles className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-sm font-medium">Care plan generated successfully based on your pet's profile.</p>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <Activity className="h-5 w-5 text-blue-500" aria-hidden="true" /> Feeding Strategy
                      </h3>
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <p className="text-gray-700 mb-3">
                          Based on a {activityLevel.toLowerCase()} activity level for a {weightKg}kg {result.sizeCategory}-breed {result.petType}
                          {result.breed ? ` (${result.breed})` : ''}, the estimated daily energy requirement is ~{result.derKcal.toLocaleString()} kcal.
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                          <li>Divide into {result.mealsPerDay} meals per day</li>
                          {result.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <Info className="h-5 w-5 text-primary" aria-hidden="true" /> Recommended Products
                      </h3>
                      {result.recommendedProducts.length === 0 ? (
                        <p className="text-gray-500 text-sm">No matching products found for this profile.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {result.recommendedProducts.map((product) => (
                            <Link key={product._id} to={`/product/${product._id}`} className="border border-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow">
                              <img src={product.image} alt={product.name} loading="lazy" className="w-16 h-16 rounded-lg object-cover" />
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                                <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                                <span className="text-primary font-bold">${formatPriceCents(product.priceCents)}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 flex justify-center">
                    <button onClick={() => { setStep(1); setResult(null); }} className="btn-outline">Start Over</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6 italic">
          *Provides general husbandry guidance only; non-veterinary diagnosis.
        </p>
      </div>
    </div>
  );
}
