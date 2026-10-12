import { Appointment } from '../models/Appointment.js';
import { Service } from '../models/Service.js';
import { Pet } from '../models/Pet.js';
import { User } from '../models/User.js';
import { sendMail } from '../services/mailer.js';
import { appointmentBookedEmail, appointmentCancelledEmail } from '../services/emailTemplates.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseSlotToDate, serviceSchedule, weekdayOf } from '../utils/appointmentTime.js';

const SERVICE_FIELDS = 'name type durationMinutes priceCents providerId';

export const listMyAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ userId: req.user._id })
    .populate({ path: 'service', select: SERVICE_FIELDS, populate: { path: 'providerId', select: 'businessName' } })
    .populate('petId', 'name species')
    .sort({ scheduledAt: -1 })
    .lean();

  const data = appointments.map((a) => ({
    ...a,
    service: a.service && {
      ...a.service,
      providerId: a.service.providerId?._id ?? null,
      providerName: a.service.providerId?.businessName ?? 'PawMart Clinic',
    },
  }));
  sendData(res, 200, data);
});

async function providerOf(service) {
  return service.providerId ? User.findById(service.providerId, 'name email businessName').lean() : null;
}

export const createAppointment = asyncHandler(async (req, res) => {
  const { serviceId, date, timeSlotLabel, petId, petDescription, notes } = req.body;

  const service = await Service.findOne({ _id: serviceId, active: true });
  if (!service) {
    throw ApiError.notFound('Service not found');
  }

  if (petId && !(await Pet.exists({ _id: petId, ownerId: req.user._id }))) {
    throw ApiError.notFound('Pet not found');
  }

  const { timeSlots, availableDays } = serviceSchedule(service);
  if (!availableDays.includes(weekdayOf(date))) {
    throw ApiError.badRequest('This service is not available on that day');
  }
  if (!timeSlots.includes(timeSlotLabel)) {
    throw ApiError.badRequest('That time slot is not offered for this service');
  }

  const scheduledAt = parseSlotToDate(date, timeSlotLabel);
  if (!scheduledAt) {
    throw ApiError.badRequest('Invalid date or time slot');
  }
  if (scheduledAt.getTime() < Date.now()) {
    throw ApiError.badRequest('Cannot book an appointment in the past');
  }

  // A provider can't be double-booked across their different services.
  if (service.providerId) {
    const providerServiceIds = await Service.find({ providerId: service.providerId }).distinct('_id');
    if (await Appointment.exists({ service: { $in: providerServiceIds }, scheduledAt, status: 'booked' })) {
      throw ApiError.conflict('The provider is already booked at that time');
    }
  }

  let appointment;
  try {
    appointment = await Appointment.create({
      userId: req.user._id,
      service: service._id,
      petId: petId || null,
      petDescription,
      scheduledAt,
      timeSlotLabel,
      notes,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw ApiError.conflict('That time slot is already booked for this service');
    }
    throw err;
  }

  sendData(res, 201, appointment);

  // Fire-and-forget notifications.
  const provider = await providerOf(service);
  const providerName = provider?.businessName ?? 'PawMart Clinic';
  sendMail({ to: req.user.email, ...appointmentBookedEmail({ appointment, service, providerName, customer: req.user, recipient: 'customer' }) });
  if (provider) {
    sendMail({ to: provider.email, ...appointmentBookedEmail({ appointment, service, providerName, customer: req.user, recipient: 'provider' }) });
  }
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, userId: req.user._id });
  if (!appointment) {
    throw ApiError.notFound('Appointment not found');
  }
  if (appointment.status !== 'booked') {
    throw ApiError.conflict(`Appointment is already ${appointment.status.replace('_', ' ')}`);
  }
  if (appointment.scheduledAt.getTime() < Date.now()) {
    throw ApiError.badRequest('Past appointments cannot be cancelled');
  }

  appointment.status = 'cancelled';
  appointment.cancelledBy = 'customer';
  await appointment.save();
  sendData(res, 200, appointment);

  const service = await Service.findById(appointment.service).lean();
  const provider = service && (await providerOf(service));
  if (provider) {
    sendMail({
      to: provider.email,
      ...appointmentCancelledEmail({ appointment, service, customer: req.user, recipient: 'provider', providerName: provider.businessName }),
    });
  }
});
