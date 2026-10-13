import { Product } from '../models/Product.js';
import { BREEDS, PRODUCT_TAGS, SOURCES } from '../data/breedProfiles.js';
import { publicProductFilter } from './visibility.js';

// ---------- Energy (calories)

// Resting Energy Requirement (RER) in kcal/day: 70 × (body weight in kg)^0.75.
function restingEnergyRequirement(weightKg) {
  return 70 * Math.pow(weightKg, 0.75);
}

// Maintenance multipliers of RER from the Merck Veterinary Manual
// (see SOURCES.merck). They are a starting point; vets adjust from there.
const MER_FACTORS = {
  dog: { intact: 1.8, neutered: 1.6, obesityProne: 1.4, puppyUnder4Months: 3.0, puppy: 2.0 },
  cat: { intact: 1.4, neutered: 1.2, obesityProne: 1.0, kitten: 2.5 },
};
// Extra allowance for very active adults (working/sporting dogs, very playful cats).
const HIGH_ACTIVITY_BONUS = { dog: 0.4, cat: 0.2 };

// Large and giant dogs keep growing until about 18 months.
function isYoung(species, ageYears, size) {
  if (species === 'cat') return ageYears < 1;
  return ageYears < (size === 'large' || size === 'giant' ? 1.5 : 1);
}

function seniorAge(species, size) {
  if (species === 'cat') return 11;
  return size === 'giant' ? 6 : size === 'large' ? 7 : 9;
}

function lifeStage(species, ageYears, size) {
  if (isYoung(species, ageYears, size)) return species === 'cat' ? 'kitten' : 'puppy';
  return ageYears >= seniorAge(species, size) ? 'senior' : 'adult';
}

function chooseFactor({ species, ageYears, stage, neutered, activityLevel, obesityProne }) {
  const f = MER_FACTORS[species];
  if (stage === 'kitten') return { factor: f.kitten, basis: 'kitten' };
  if (stage === 'puppy') {
    return ageYears < 1 / 3 ? { factor: f.puppyUnder4Months, basis: 'puppy under 4 months' } : { factor: f.puppy, basis: 'growing puppy' };
  }
  if (activityLevel === 'Low' || (obesityProne && activityLevel !== 'High')) {
    return { factor: f.obesityProne, basis: activityLevel === 'Low' ? 'low activity' : 'obesity-prone breed' };
  }
  const base = neutered === 'no' ? f.intact : f.neutered;
  const basis = neutered === 'no' ? 'intact adult' : 'neutered adult';
  return activityLevel === 'High'
    ? { factor: +(base + HIGH_ACTIVITY_BONUS[species]).toFixed(1), basis: `${basis}, very active` }
    : { factor: base, basis };
}

function mealsPerDay(species, stage, ageYears, size) {
  if (stage === 'kitten' || stage === 'puppy') {
    if (ageYears < 0.5) return 4;
    return 3;
  }
  if (species === 'dog' && size === 'toy') return 3; // small, frequent meals avoid low blood sugar
  return 2;
}

// ---------- Breed matching

function normalise(text) {
  return text.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Edit distance counting insertions, deletions, substitutions and swaps.
function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      // Swapped neighbouring letters ("labardor") count as one typo.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[a.length][b.length];
}

// Finds the breed profile for free text like "golden", "GSD" or "labardor".
export function matchBreed(species, text) {
  if (!text) return null;
  const query = normalise(text);
  if (!query) return null;
  const candidates = BREEDS.filter((b) => b.species === species);
  const names = (b) => [normalise(b.name), ...b.aliases.map(normalise)];

  // 1. exact name or alias
  const exact = candidates.find((b) => names(b).includes(query));
  if (exact) return exact;
  // 2. every word of an alias appears in the query ("my black lab puppy")
  const contained = candidates.find((b) =>
    names(b).some((n) => n.length >= 3 && n.split(' ').every((w) => query.split(' ').includes(w)))
  );
  if (contained) return contained;
  // 3. small typo
  let best = null;
  for (const b of candidates) {
    for (const n of names(b)) {
      if (n.length < 5) continue;
      const d = editDistance(query, n);
      const allowed = n.length >= 9 ? 2 : 1;
      if (d <= allowed && (!best || d < best.d)) best = { b, d };
    }
  }
  return best?.b ?? null;
}

export function listBreeds(species) {
  return BREEDS.filter((b) => !species || b.species === species).map((b) => ({ id: b.id, species: b.species, name: b.name }));
}

// ---------- Weight

function weightStatus(weightKg, profile, stage) {
  if (!profile || stage === 'puppy' || stage === 'kitten' || profile.size === 'variable') return null;
  const [min, max] = profile.weightKg;
  const status = weightKg < min * 0.9 ? 'under' : weightKg > max * 1.1 ? 'over' : 'within';
  return { min, max, status };
}

// ---------- Products

function parseAllergyTerms(allergiesText) {
  if (!allergiesText) return [];
  return allergiesText
    .split(/[,;\n]/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
}

const OTHER_SPECIES = { dog: /\b(cat|kitten|feline)s?\b/i, cat: /\b(dog|puppy|canine)s?\b/i };

// Ranks catalogue products by how well they fit the breed's needs, after
// removing anything for the other species or matching the pet's allergies.
export async function recommendProducts(species, allergiesText, tags = [], limit = 4) {
  const allergyTerms = parseAllergyTerms(allergiesText);
  const candidates = await Product.find({ ...(await publicProductFilter()), stock: { $gt: 0 } })
    .sort({ rating: -1 })
    .limit(100)
    .lean();

  const scored = [];
  for (const product of candidates) {
    const text = [product.name, product.category, product.description, ...(product.features || [])].join(' ');
    const lower = text.toLowerCase();
    if (OTHER_SPECIES[species].test(product.name)) continue;
    if (allergyTerms.some((term) => lower.includes(term))) continue;

    const matched = tags.filter((tag) => PRODUCT_TAGS[tag]?.pattern.test(text));
    const forSpecies = new RegExp(`\\b${species}`, 'i').test(product.name);
    const isFood = product.category === 'Food';
    // Breed-fit first, then species-specific items, then food, then rating.
    const score = matched.length * 10 + (forSpecies ? 4 : 0) + (isFood && forSpecies ? 2 : 0) + (product.rating || 0) / 5;
    if (!matched.length && !forSpecies && !['Food', 'Health'].includes(product.category)) continue;

    scored.push({
      product: {
        _id: product._id,
        name: product.name,
        image: product.image,
        category: product.category,
        priceCents: product.priceCents,
        rating: product.rating,
      },
      reason: matched.length
        ? PRODUCT_TAGS[matched[0]].reason
        : isFood && forSpecies
          ? `Complete food for ${species}s`
          : `Popular with ${species} owners`,
      score,
    });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product, reason }) => ({ ...product, reason }));
}

// ---------- Plan

const HEAT_NOTES = {
  very_high: 'Very sensitive to heat: in a hot, humid climate exercise only at dawn or after dark, keep them indoors in the hottest hours, and learn the signs of heatstroke (heavy panting, drooling, collapse).',
  high: 'Prone to overheating in hot, humid weather — walk in the cool of the morning or evening and always leave shade and water.',
};

export async function buildCarePlan({ petType, breed, ageYears, weightKg, activityLevel, neutered = 'unsure', allergies }) {
  const profile = matchBreed(petType, breed);
  const size = profile?.size && profile.size !== 'variable' ? profile.size : sizeFromWeight(weightKg, petType);
  const stage = lifeStage(petType, ageYears, size);
  const weight = weightStatus(weightKg, profile, stage);

  // Overweight adults are fed for the top of the breed's healthy range.
  const feedForKg = weight?.status === 'over' ? weight.max : weightKg;
  const { factor, basis } = chooseFactor({
    species: petType,
    ageYears,
    stage,
    neutered,
    activityLevel,
    obesityProne: profile?.obesityProne || weight?.status === 'over',
  });
  const rer = restingEnergyRequirement(feedForKg);
  const dailyKcal = Math.round((rer * factor) / 5) * 5;
  const meals = mealsPerDay(petType, stage, ageYears, size);

  const feedingNotes = [];
  if (stage === 'puppy' || stage === 'kitten') {
    feedingNotes.push(`Growing ${stage}s need about ${factor}× their resting energy — use a ${stage} formula food and re-check the amount as they grow.`);
  }
  if (weight?.status === 'over') {
    feedingNotes.push(`Above the usual ${weight.min}–${weight.max} kg range, so calories are set for ${weight.max} kg to support gradual weight loss. Check your pet's body condition with your vet before starting a diet.`);
  } else if (weight?.status === 'under') {
    feedingNotes.push(`Below the usual ${weight.min}–${weight.max} kg range — if your pet is also thin to the touch, ask your vet before increasing food.`);
  }
  if (profile?.obesityProne && stage !== 'puppy' && stage !== 'kitten') {
    feedingNotes.push(`${profile.name}s gain weight easily, so this starts from the lower "obesity-prone" level. Count treats as part of the daily total (keep treats under 10%).`);
  }
  if (stage === 'senior') {
    feedingNotes.push('Senior pets often need fewer calories but good-quality protein; regular vet check-ups help catch age-related problems early.');
  }
  if (neutered === 'unsure' && stage !== 'puppy' && stage !== 'kitten') {
    feedingNotes.push('Calculated as neutered. Intact pets usually need a little more.');
  }
  feedingNotes.push('Adjust by body condition: you should be able to feel the ribs easily without seeing them.');

  const tags = [...(profile?.productTags ?? [])];
  if (!profile) tags.push(petType === 'dog' ? 'exercise' : 'play');
  const products = await recommendProducts(petType, allergies, tags);

  const sourceKeys = new Set(['merck']);
  if (profile) sourceKeys.add('akcWeights');
  for (const item of profile?.watchFor ?? []) if (item.source) sourceKeys.add(item.source);

  return {
    petType,
    breedInput: breed || null,
    breed: profile
      ? {
          id: profile.id,
          name: profile.name,
          size: profile.size,
          weightKg: profile.weightKg,
          exerciseMinutes: profile.exerciseMinutes,
          grooming: profile.grooming,
          heat: profile.heat,
          heatNote: HEAT_NOTES[profile.heat] ?? null,
          brachycephalic: Boolean(profile.brachycephalic),
          watchFor: profile.watchFor.map((w) => ({ ...w, source: w.source ? SOURCES[w.source] : null })),
          careTips: profile.careTips,
        }
      : null,
    // Breed typed but not recognised: offer the breeds we do have advice for.
    breedSuggestions: profile || !breed ? [] : listBreeds(petType).map((b) => b.name),
    lifeStage: stage,
    sizeCategory: size,
    weight: weight ? { ...weight, current: weightKg } : { current: weightKg, status: null },
    feeding: {
      dailyKcal,
      mealsPerDay: meals,
      kcalPerMeal: Math.round(dailyKcal / meals / 5) * 5,
      factor,
      basis,
      feedForKg,
      notes: feedingNotes,
    },
    recommendedProducts: products,
    sources: [...sourceKeys].map((k) => SOURCES[k]),
    disclaimer: 'General husbandry guidance only — not a veterinary diagnosis. Your vet can tailor advice to your pet.',
  };
}

function sizeFromWeight(weightKg, petType) {
  if (petType === 'cat') return weightKg < 4 ? 'small' : weightKg < 6 ? 'medium' : 'large';
  if (weightKg < 5) return 'toy';
  if (weightKg < 10) return 'small';
  if (weightKg < 25) return 'medium';
  if (weightKg < 45) return 'large';
  return 'giant';
}
