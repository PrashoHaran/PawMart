import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['vet', 'grooming'], required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    priceCents: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);
