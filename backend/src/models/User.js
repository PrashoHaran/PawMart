import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer' },
    businessName: { type: String, trim: true },
    // Set when a vendor application is approved; decides whether the vendor
    // sells products or offers bookable services.
    businessType: { type: String, enum: ['retail_vendor', 'service_provider'] },
    tokenVersion: { type: Number, default: 0 },
    // Suspended accounts can't sign in, and their products/services are
    // hidden from customers.
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    suspendedAt: { type: Date, default: null },
    suspendReason: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
