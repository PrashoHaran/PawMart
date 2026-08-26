import { Service } from '../models/Service.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ active: true }).sort({ name: 1 }).lean();
  sendData(res, 200, services);
});
