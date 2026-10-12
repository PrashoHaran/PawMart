import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', default: null },
    petDescription: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    timeSlotLabel: { type: String, required: true },
    notes: { type: String, default: '' },
    // "booked" is an active booking; completed / no_show are set by the
    // provider after the visit time.
    status: { type: String, enum: ['booked', 'cancelled', 'completed', 'no_show'], default: 'booked' },
    cancelledBy: { type: String, enum: ['customer', 'provider', 'admin'], default: undefined },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

appointmentSchema.index({ userId: 1, scheduledAt: -1 });
// Prevent double-booking the same service in the same slot; cancelled
// appointments are excluded so a freed slot can be rebooked.
appointmentSchema.index(
  { service: 1, scheduledAt: 1 },
  { unique: true, partialFilterExpression: { status: 'booked' } }
);

export const Appointment = mongoose.model('Appointment', appointmentSchema);
