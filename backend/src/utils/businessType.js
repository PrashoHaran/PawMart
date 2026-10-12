import { VendorApplication } from '../models/VendorApplication.js';

// Vendors approved before businessType was stored on the user: copy it from
// their approved application once, so later requests don't need the lookup.
export async function ensureBusinessType(user) {
  if (user.role !== 'vendor' || user.businessType) return user;
  const application = await VendorApplication.findOne(
    { userId: user._id, status: 'approved' },
    'businessType'
  ).sort({ reviewedAt: -1 });
  user.businessType = application?.businessType ?? 'retail_vendor';
  await user.save();
  return user;
}
