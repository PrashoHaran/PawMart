import { Appointment } from '../models/Appointment.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { VendorApplication } from '../models/VendorApplication.js';
import { changeAppointmentStatus } from '../services/appointmentStatus.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------- Users

export const listUsers = asyncHandler(async (req, res) => {
  const { search, role, status, page, limit } = req.query;
  const query = {};
  if (role) query.role = role;
  if (status) query.status = status === 'active' ? { $ne: 'suspended' } : status;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ name: pattern }, { email: pattern }, { businessName: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(query, 'name email role businessName businessType status suspendedAt suspendReason createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  sendData(res, 200, users.map((u) => ({ ...u, status: u.status ?? 'active' })), { page, per_page: limit, total });
});

async function findOtherUser(req) {
  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest("You can't change your own account here");
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

async function assertNotLastAdmin(user) {
  if (user.role === 'admin' && (await User.countDocuments({ role: 'admin', status: { $ne: 'suspended' } })) <= 1) {
    throw ApiError.conflict('PawMart needs at least one active admin');
  }
}

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await findOtherUser(req);
  const { status, reason } = req.body;

  if (status === 'suspended') {
    await assertNotLastAdmin(user);
    user.status = 'suspended';
    user.suspendedAt = new Date();
    user.suspendReason = reason;
    user.tokenVersion += 1; // signs them out everywhere
  } else {
    user.status = 'active';
    user.suspendedAt = null;
    user.suspendReason = '';
  }
  await user.save();
  sendData(res, 200, user);
});

// Admins can be appointed or removed; vendor access comes from applications.
export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await findOtherUser(req);
  const { role } = req.body;

  if (user.role === 'vendor') {
    throw ApiError.badRequest("Vendors' roles can't be changed here; suspend the account instead");
  }
  if (user.role === role) {
    return sendData(res, 200, user);
  }
  if (role === 'customer') {
    await assertNotLastAdmin(user);
  }
  user.role = role;
  user.tokenVersion += 1; // new role takes effect on next sign-in
  await user.save();
  sendData(res, 200, user);
});

// ---------- Vendor applications

export const listApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const applications = await VendorApplication.find(status ? { status } : {})
    .populate('userId', 'name email status')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  sendData(res, 200, applications);
});

// ---------- Products: moderation + PawMart's own catalogue

export const listAllProducts = asyncHandler(async (req, res) => {
  const { search, owner, visibility, page, limit } = req.query;
  const query = {};
  if (owner === 'house') query.vendorId = null;
  if (owner === 'vendor') query.vendorId = { $ne: null };
  if (visibility === 'hidden') query.hidden = true;
  if (visibility === 'visible') query.hidden = { $ne: true };
  if (visibility === 'low_stock') Object.assign(query, { stock: { $lte: 5 } });
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ name: pattern }, { vendorName: pattern }, { category: pattern }];
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('vendorId', 'status')
      .lean(),
    Product.countDocuments(query),
  ]);

  const data = products.map(({ vendorId, ...p }) => ({
    ...p,
    vendorId: vendorId?._id ?? null,
    isHouseProduct: !vendorId,
    vendorSuspended: vendorId?.status === 'suspended',
  }));
  sendData(res, 200, data, { page, per_page: limit, total });
});

export const setProductVisibility = asyncHandler(async (req, res) => {
  const { hidden, reason } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { hidden, hiddenReason: hidden ? reason : '' },
    { new: true }
  );
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  sendData(res, 200, product);
});

export const createHouseProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, vendorName: 'PawMart', vendorId: null });
  sendData(res, 201, product);
});

async function findHouseProduct(id) {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  if (product.vendorId) {
    throw ApiError.forbidden("Vendor products are managed by their vendor; you can only hide them");
  }
  return product;
}

export const updateHouseProduct = asyncHandler(async (req, res) => {
  const product = await findHouseProduct(req.params.id);
  product.set(req.body);
  await product.save();
  sendData(res, 200, product);
});

export const deleteHouseProduct = asyncHandler(async (req, res) => {
  const product = await findHouseProduct(req.params.id);
  await product.deleteOne();
  await Review.deleteMany({ productId: product._id });
  sendData(res, 200, { deleted: true });
});

// ---------- Appointments

export const listAllAppointments = asyncHandler(async (req, res) => {
  const { scope, owner, page, limit } = req.query;
  const now = new Date();
  const query = {};
  if (scope === 'upcoming') Object.assign(query, { status: 'booked', scheduledAt: { $gte: now } });
  if (scope === 'needs_update') Object.assign(query, { status: 'booked', scheduledAt: { $lt: now } });
  if (scope === 'past') query.$or = [{ scheduledAt: { $lt: now } }, { status: { $ne: 'booked' } }];
  if (owner === 'clinic') query.service = { $in: await Service.find({ providerId: null }).distinct('_id') };

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .sort({ scheduledAt: scope === 'upcoming' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'service', select: 'name type durationMinutes priceCents providerId', populate: { path: 'providerId', select: 'businessName' } })
      .populate('userId', 'name email')
      .populate('petId', 'name species breed allergies')
      .lean(),
    Appointment.countDocuments(query),
  ]);

  const data = appointments.map(({ userId, service, ...a }) => ({
    ...a,
    customer: userId ? { name: userId.name, email: userId.email } : null,
    service: service && { ...service, providerId: service.providerId?._id ?? null },
    providerName: service?.providerId?.businessName ?? 'PawMart Clinic',
  }));
  sendData(res, 200, data, { page, per_page: limit, total });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    throw ApiError.notFound('Appointment not found');
  }
  await changeAppointmentStatus(appointment, { ...req.body, byRole: 'admin' });
  sendData(res, 200, appointment);
});
