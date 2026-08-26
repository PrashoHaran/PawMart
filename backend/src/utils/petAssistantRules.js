import { Product } from '../models/Product.js';

// Resting Energy Requirement (RER) in kcal/day, a standard veterinary nutrition
// formula: RER = 70 * (body weight in kg) ^ 0.75.
function restingEnergyRequirement(weightKg) {
  return 70 * Math.pow(weightKg, 0.75);
}

// Activity multipliers applied to RER to estimate Daily Energy Requirement (DER).
// Ranges are commonly cited veterinary nutrition guidelines, not exact per-animal values.
const ACTIVITY_MULTIPLIERS = {
  dog: { Low: 1.2, Moderate: 1.6, High: 2.0 },
  cat: { Low: 1.0, Moderate: 1.2, High: 1.4 },
};

export function computeDER(weightKg, activityLevel, petType) {
  const multiplier = ACTIVITY_MULTIPLIERS[petType]?.[activityLevel];
  const rer = restingEnergyRequirement(weightKg);
  return Math.round(rer * multiplier);
}

export function mealFrequency(ageYears) {
  if (ageYears < 1) {
    return {
      mealsPerDay: 4,
      note: 'Puppies and kittens need frequent small meals to support rapid growth.',
    };
  }
  if (ageYears >= 7) {
    return {
      mealsPerDay: 3,
      note: 'Senior pets often do better with smaller, more frequent meals to support digestion.',
    };
  }
  return {
    mealsPerDay: 2,
    note: 'Divide the daily total evenly across morning and evening meals.',
  };
}

const SIZE_THRESHOLDS = {
  dog: { small: 10, medium: 25 },
  cat: { small: 4, medium: 6 },
};

export function sizeCategory(weightKg, petType) {
  const thresholds = SIZE_THRESHOLDS[petType] || SIZE_THRESHOLDS.dog;
  if (weightKg < thresholds.small) return 'small';
  if (weightKg < thresholds.medium) return 'medium';
  return 'large';
}

function parseAllergyTerms(allergiesText) {
  if (!allergiesText) return [];
  return allergiesText
    .split(/[,;\n]/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
}

export async function recommendProducts(petType, allergiesText, limit = 4) {
  const allergyTerms = parseAllergyTerms(allergiesText);

  const candidates = await Product.find({ category: { $in: ['Food', 'Health', 'Accessories'] } })
    .sort({ rating: -1 })
    .limit(20)
    .lean();

  const safeCandidates = candidates.filter((product) => {
    const haystack = [product.name, product.description, ...(product.features || [])]
      .join(' ')
      .toLowerCase();
    return !allergyTerms.some((term) => haystack.includes(term));
  });

  return safeCandidates.slice(0, limit);
}
