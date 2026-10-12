import { Appointment } from '../models/Appointment.js';
import { Service } from '../models/Service.js';
import { Pet } from '../models/Pet.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function parseSlotToDate(date, timeSlotLabel) {
  const match = timeSlotLabel.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;

  let [, hours, minutes, meridiem] = match;
  hours = parseInt(hours, 10);
  meridiem = meridiem.toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const scheduledAt = new Date(`${date}T${String(hours).padStart(2, '0')}:${minutes}:00`);
  return Number.isNaN(scheduledAt.getTime()) ? null : scheduledAt;
}

export const listMyAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ userId: req.user._id })
    .populate('service', 'name type durationMinutes priceCents')
    .populate('petId', 'name species')
    .sort({ scheduledAt: -1 })
    .lean();
  sendData(res, 200, appointments);
});

export const createAppointment = asyncHandler(async (req, res) => {
  const { serviceId, date, timeSlotLabel, petId, petDescription, notes } = req.body;

  const service = await Service.findOne({ _id: serviceId, active: true });
  if (!service) {
    throw ApiError.notFound('Service not found');
  }

  if (petId && !(await Pet.exists({ _id: petId, ownerId: req.user._id }))) {
    throw ApiError.notFound('Pet not found');
  }

  const scheduledAt = parseSlotToDate(date, timeSlotLabel);
  if (!scheduledAt) {
    throw ApiError.badRequest('Invalid date or time slot');
  }
  if (scheduledAt.getTime() < Date.now()) {
    throw ApiError.badRequest('Cannot book an appointment in the past');
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
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, userId: req.user._id });
  if (!appointment) {
    throw ApiError.notFound('Appointment not found');
  }
  if (appointment.status === 'cancelled') {
    throw ApiError.conflict('Appointment is already cancelled');
  }
  if (appointment.scheduledAt.getTime() < Date.now()) {
    throw ApiError.badRequest('Past appointments cannot be cancelled');
  }

  appointment.status = 'cancelled';
  await appointment.save();
  sendData(res, 200, appointment);
});
