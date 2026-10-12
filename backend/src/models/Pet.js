import mongoose from 'mongoose';

export const PET_SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'fish', 'other'];

const petSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    species: { type: String, enum: PET_SPECIES, required: true },
    breed: { type: String, default: '', trim: true },
    sex: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
    birthDate: { type: Date, default: null },
    weightKg: { type: Number, min: 0, default: null },
    allergies: { type: [String], default: [] },
    photoUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

petSchema.index({ ownerId: 1, createdAt: 1 });

export const Pet = mongoose.model('Pet', petSchema);
