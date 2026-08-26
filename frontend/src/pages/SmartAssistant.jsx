import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, ChevronRight, Activity, Info } from 'lucide-react';

export default function SmartAssistant() {
  const [step, setStep] = useState(1);
  const [petType, setPetType] = useState('');
  const [activityLevel, setActivityLevel] = useState('');

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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                      <input type="text" className="input-field" placeholder="e.g. Golden Retriever" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age (Years)</label>
                        <input type="number" className="input-field" placeholder="3" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input type="number" className="input-field" placeholder="25" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
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
                      <label className="block text-sm font-medium text-gray-700 mb-3">Known Allergies / Sensitivities</label>
                      <textarea className="input-field min-h-[100px]" placeholder="List any known allergies (e.g. Chicken, Grain)"></textarea>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setStep(1)} className="btn-outline">Back</button>
                    <button onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
                      Generate Plan <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
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
                        <p className="text-gray-700 mb-3">Based on a moderate activity level for a 25kg Golden Retriever, the recommended daily caloric intake is ~1,100 kcal.</p>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                          <li>Divide into 2 meals (Morning & Evening)</li>
                          <li>Avoid grain-heavy fillers to manage weight</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <Info className="h-5 w-5 text-primary" aria-hidden="true" /> Recommended Products
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link to="/product/1" className="border border-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow">
                          <img src="https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Dog Food" loading="lazy" className="w-16 h-16 rounded-lg object-cover" />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">Premium Salmon Recipe</p>
                            <p className="text-xs text-gray-500 mb-2">High protein, grain-free</p>
                            <span className="text-primary font-bold">$45.99</span>
                          </div>
                        </Link>
                        <Link to="/product/6" className="border border-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow">
                          <img src="https://images.unsplash.com/photo-1631669969504-f35518bf96ba?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Vitamins" loading="lazy" className="w-16 h-16 rounded-lg object-cover" />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">Joint Health Chews</p>
                            <p className="text-xs text-gray-500 mb-2">Glucosamine supplement</p>
                            <span className="text-primary font-bold">$24.00</span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-center">
                    <button onClick={() => setStep(1)} className="btn-outline">Start Over</button>
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
