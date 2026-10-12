import { Appointment } from '../models/Appointment.js';
import { Service } from '../models/Service.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicServiceFilter } from '../utils/visibility.js';
import { parseSlotToDate, serviceSchedule, weekdayOf } from '../utils/appointmentTime.js';

export function serializeService(service) {
  const { providerId, ...rest } = service;
  return {
    ...rest,
    ...serviceSchedule(service),
    providerId: providerId?._id ?? providerId ?? null,
    providerName: providerId?.businessName ?? 'PawMart Clinic',
  };
}

export const listServices = asyncHandler(async (req, res) => {
  const services = await Service.find(await publicServiceFilter())
    .sort({ name: 1 })
    .populate('providerId', 'businessName')
    .lean();
  sendData(res, 200, services.map(serializeService));
});

// Which of a service's slots can still be booked on a given date.
export const getAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const service = await Service.findOne({ _id: req.params.id, ...(await publicServiceFilter()) }).lean();
  if (!service) {
    throw ApiError.notFound('Service not found');
  }

  const { timeSlots, availableDays } = serviceSchedule(service);
  if (!availableDays.includes(weekdayOf(date))) {
    return sendData(res, 200, { date, open: false, slots: [] });
  }

  const slotTimes = timeSlots.map((label) => ({ label, at: parseSlotToDate(date, label) }));
  // A provider can only be in one place at a time, so slots taken on any of
  // their services are unavailable too.
  const serviceIds = service.providerId
    ? await Service.find({ providerId: service.providerId }).distinct('_id')
    : [service._id];
  const taken = await Appointment.find(
    { service: { $in: serviceIds }, status: 'booked', scheduledAt: { $in: slotTimes.map((s) => s.at) } },
    'scheduledAt'
  ).lean();
  const takenTimes = new Set(taken.map((a) => a.scheduledAt.getTime()));
  const now = Date.now();

  const slots = slotTimes.map(({ label, at }) => ({
    label,
    available: at.getTime() > now && !takenTimes.has(at.getTime()),
    reason: at.getTime() <= now ? 'past' : takenTimes.has(at.getTime()) ? 'booked' : null,
  }));
  sendData(res, 200, { date, open: true, slots });
});
