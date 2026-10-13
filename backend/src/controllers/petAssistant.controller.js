import { buildCarePlan, listBreeds } from '../utils/petAssistantRules.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getRecommendation = asyncHandler(async (req, res) => {
  sendData(res, 200, await buildCarePlan(req.body));
});

export const getBreeds = (req, res) => {
  sendData(res, 200, listBreeds(req.query.species));
};
