import mongoose from 'mongoose';

const vendorApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true, trim: true },
    businessType: { type: String, enum: ['service_provider', 'retail_vendor'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

vendorApplicationSchema.index({ userId: 1, status: 1 });

export const VendorApplication = mongoose.model('VendorApplication', vendorApplicationSchema);
