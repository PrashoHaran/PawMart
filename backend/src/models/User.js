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
