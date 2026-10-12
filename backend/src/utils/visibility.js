import { User } from '../models/User.js';

export function suspendedUserIds() {
  return User.find({ status: 'suspended' }).distinct('_id');
}

// Filter for products customers may see and buy: not hidden by an admin and
// not sold by a suspended vendor.
export async function publicProductFilter() {
  const suspended = await suspendedUserIds();
  return { hidden: { $ne: true }, ...(suspended.length ? { vendorId: { $nin: suspended } } : {}) };
}

// Same idea for bookable services.
export async function publicServiceFilter() {
  const suspended = await suspendedUserIds();
  return { active: true, ...(suspended.length ? { providerId: { $nin: suspended } } : {}) };
}
