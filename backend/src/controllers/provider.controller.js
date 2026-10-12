import { Appointment } from '../models/Appointment.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { sendMail } from '../services/mailer.js';
import { appointmentCancelledEmail } from '../services/emailTemplates.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sortSlots } from '../utils/appointmentTime.js';
import { serializeService } from './service.controller.js';

function withSortedSlots(body) {
  return body.timeSlots ? { ...body, timeSlots: sortSlots(body.timeSlots) } : body;
}

export const listMyServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ providerId: req.user._id }).sort({ active: -1, name: 1 }).lean();
  sendData(res, 200, services.map((s) => ({ ...serializeService(s), providerName: req.user.businessName })));
});

export const createMyService = asyncHandler(async (req, res) => {
  const service = await Service.create({ ...withSortedSlots(req.body), providerId: req.user._id });
  sendData(res, 201, service);
});

export const updateMyService = asyncHandler(async (req, res) => {
  const service = await Service.findOneAndUpdate(
    { _id: req.params.id, providerId: req.user._id },
    withSortedSlots(req.body),
    { new: true, runValidators: true }
  );
  if (!service) {
    throw ApiError.notFound('Service not found');
  }
  sendData(res, 200, service);
});

// Services with booking history are deactivated rather than deleted.
export const deleteMyService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, providerId: req.user._id });
  if (!service) {
    throw ApiError.notFound('Service not found');
  }
  if (await Appointment.exists({ service: service._id, status: 'booked', scheduledAt: { $gte: new Date() } })) {
    throw ApiError.conflict('This service has upcoming bookings; cancel them before removing it');
  }
  if (await Appointment.exists({ service: service._id })) {
    service.active = false;
    await service.save();
    return sendData(res, 200, { deleted: false, deactivated: true });
  }
  await service.deleteOne();
  sendData(res, 200, { deleted: true });
});

export const listMyAppointments = asyncHandler(async (req, res) => {
  const { scope, page, limit } = req.query;
  const serviceIds = await Service.find({ providerId: req.user._id }).distinct('_id');
  const now = new Date();

  const query = { service: { $in: serviceIds } };
  if (scope === 'upcoming') Object.assign(query, { status: 'booked', scheduledAt: { $gte: now } });
  if (scope === 'past') query.$or = [{ scheduledAt: { $lt: now } }, { status: { $ne: 'booked' } }];

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .sort({ scheduledAt: scope === 'upcoming' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('service', 'name type durationMinutes priceCents')
      .populate('userId', 'name email')
      .populate('petId', 'name species breed allergies')
      .lean(),
    Appointment.countDocuments(query),
  ]);

  const data = appointments.map(({ userId, ...a }) => ({
    ...a,
    customer: userId ? { name: userId.name, email: userId.email } : null,
  }));
  sendData(res, 200, data, { page, per_page: limit, total });
});

export const updateMyAppointmentStatus = asyncHandler(async (req, res) => {
  const serviceIds = await Service.find({ providerId: req.user._id }).distinct('_id');
  const appointment = await Appointment.findOne({ _id: req.params.id, service: { $in: serviceIds } });
  if (!appointment) {
    throw ApiError.notFound('Appointment not found');
  }
  if (appointment.status !== 'booked') {
    throw ApiError.conflict(`Appointment is already ${appointment.status.replace('_', ' ')}`);
  }

  const { status, reason } = req.body;
  const started = appointment.scheduledAt.getTime() <= Date.now();
  if (status === 'cancelled' && started) {
    throw ApiError.badRequest('Past appointments cannot be cancelled; mark them completed or no-show');
  }
  if (status !== 'cancelled' && !started) {
    throw ApiError.badRequest('Appointments can only be marked completed or no-show once they have started');
  }

  appointment.status = status;
  if (status === 'cancelled') {
    appointment.cancelledBy = 'provider';
    appointment.cancelReason = reason;
  }
  await appointment.save();
  sendData(res, 200, appointment);

  if (status === 'cancelled') {
    const [service, customer] = await Promise.all([
      Service.findById(appointment.service).lean(),
      User.findById(appointment.userId, 'name email').lean(),
    ]);
    if (customer) {
      sendMail({
        to: customer.email,
        ...appointmentCancelledEmail({ appointment, service, customer, recipient: 'customer', providerName: req.user.businessName }),
      });
    }
  }
});

export const getMyProviderStats = asyncHandler(async (req, res) => {
  const services = await Service.find({ providerId: req.user._id }, 'active priceCents').lean();
  const serviceIds = services.map((s) => s._id);
  const now = new Date();

  const [upcoming, completedAgg, noShows] = await Promise.all([
    Appointment.countDocuments({ service: { $in: serviceIds }, status: 'booked', scheduledAt: { $gte: now } }),
    Appointment.aggregate([
      { $match: { service: { $in: serviceIds }, status: 'completed' } },
      { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 's' } },
      { $addFields: { priceCents: { $ifNull: [{ $arrayElemAt: ['$s.priceCents', 0] }, 0] } } },
      { $group: { _id: null, count: { $sum: 1 }, earningsCents: { $sum: '$priceCents' } } },
    ]),
    Appointment.countDocuments({ service: { $in: serviceIds }, status: 'no_show' }),
  ]);

  sendData(res, 200, {
    activeServices: services.filter((s) => s.active).length,
    upcomingAppointments: upcoming,
    completedAppointments: completedAgg[0]?.count ?? 0,
    earningsCents: completedAgg[0]?.earningsCents ?? 0,
    noShows,
  });
});
