import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Absent for accounts created with Google sign-in.
    passwordHash: { type: String },
    // Google account ID (the ID token's `sub`), set when signed in with Google.
    googleId: { type: String },
    avatarUrl: { type: String, default: '' },
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

userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.hasPassword = Boolean(ret.passwordHash);
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
