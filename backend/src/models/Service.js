import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['vet', 'grooming'], required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    priceCents: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    // Service provider offering this service; null for PawMart's own
    // services, which admins manage.
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Bookable start times (e.g. "09:00 AM") and weekdays (0 = Sunday).
    timeSlots: { type: [String], default: undefined },
    availableDays: { type: [Number], default: undefined },
  },
  { timestamps: true }
);

serviceSchema.index({ providerId: 1 });

export const Service = mongoose.model('Service', serviceSchema);
