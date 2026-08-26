import { computeDER, mealFrequency, sizeCategory, recommendProducts } from '../utils/petAssistantRules.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getRecommendation = asyncHandler(async (req, res) => {
  const { petType, breed, ageYears, weightKg, activityLevel, allergies } = req.body;

  const derKcal = computeDER(weightKg, activityLevel, petType);
  const { mealsPerDay, note: mealNote } = mealFrequency(ageYears);
  const size = sizeCategory(weightKg, petType);
  const recommendedProducts = await recommendProducts(petType, allergies);

  const notes = [
    mealNote,
    `Estimated for a ${size}-breed ${petType} — general sizing since breed-specific data isn't tracked.`,
  ];
  if (allergies) {
    notes.push(`Products matching "${allergies}" were excluded from recommendations.`);
  }

  sendData(res, 200, {
    petType,
    breed: breed || null,
    derKcal,
    mealsPerDay,
    sizeCategory: size,
    notes,
    recommendedProducts,
  });
});
