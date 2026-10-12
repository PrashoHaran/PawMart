import mongoose from 'mongoose';

const vaccinationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  dateGiven: { type: Date, required: true },
  nextDueDate: { type: Date, default: null },
  vetName: { type: String, default: '', trim: true },
  notes: { type: String, default: '', trim: true },
  // The nextDueDate a reminder email was last sent for; changing the due
  // date re-arms the reminder.
  reminderSentFor: { type: Date, default: null },
});

// One health record per pet (Pet 1 — 1 PetHealthRecord in the ERD).
const petHealthRecordSchema = new mongoose.Schema(
  {
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true, unique: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vaccinations: { type: [vaccinationSchema], default: [] },
    conditions: { type: [String], default: [] },
    medicalNotes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

petHealthRecordSchema.index({ ownerId: 1 });
petHealthRecordSchema.index({ 'vaccinations.nextDueDate': 1 });

export const PetHealthRecord = mongoose.model('PetHealthRecord', petHealthRecordSchema);
