import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sendMail } from './mailer.js';
import { appointmentCancelledEmail } from './emailTemplates.js';

// Provider/admin outcome for a booking: cancel it before it starts (with a
// reason emailed to the customer), or mark it completed / no-show afterwards.
export async function changeAppointmentStatus(appointment, { status, reason, byRole }) {
  if (appointment.status !== 'booked') {
    throw ApiError.conflict(`Appointment is already ${appointment.status.replace('_', ' ')}`);
  }

  const started = appointment.scheduledAt.getTime() <= Date.now();
  if (status === 'cancelled' && started) {
    throw ApiError.badRequest('Past appointments cannot be cancelled; mark them completed or no-show');
  }
  if (status !== 'cancelled' && !started) {
    throw ApiError.badRequest('Appointments can only be marked completed or no-show once they have started');
  }

  appointment.status = status;
  if (status === 'cancelled') {
    appointment.cancelledBy = byRole;
    appointment.cancelReason = reason;
  }
  await appointment.save();

  if (status === 'cancelled') {
    const [service, customer] = await Promise.all([
      Service.findById(appointment.service).populate('providerId', 'businessName').lean(),
      User.findById(appointment.userId, 'name email').lean(),
    ]);
    if (customer) {
      sendMail({
        to: customer.email,
        ...appointmentCancelledEmail({
          appointment,
          service,
          customer,
          recipient: 'customer',
          providerName: service?.providerId?.businessName ?? 'PawMart Clinic',
        }),
      });
    }
  }
  return appointment;
}
