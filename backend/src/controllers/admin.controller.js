import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import { VendorApplication } from '../models/VendorApplication.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Service } from '../models/Service.js';
import { env } from '../config/env.js';
import { isCloudinaryConfigured } from '../utils/cloudinary.js';
import { advanceItems, cancelOrder, withPayments } from '../services/orderFulfilment.js';
import { ApiError } from '../utils/ApiError.js';
import { runVaccinationReminders } from '../jobs/vaccinationReminders.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const LOW_STOCK_THRESHOLD = 5;

// Platform numbers plus actionable alerts for the Platform Health view.
export const getAdminStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const clinicServiceIds = await Service.find({ providerId: null }).distinct('_id');

  const [
    totalUsers,
    totalVendors,
    suspendedUsers,
    totalAppointments,
    pendingVendorApplications,
    orderTotals,
    lowStock,
    outOfStock,
    clinicNeedsUpdate,
    staleOrders,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'vendor' }),
    User.countDocuments({ status: 'suspended' }),
    Appointment.countDocuments({ status: 'booked' }),
    VendorApplication.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, count: { $sum: 1 }, revenueCents: { $sum: '$totalCents' } } },
    ]),
    Product.find({ hidden: { $ne: true }, stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }, 'name stock vendorName')
      .sort({ stock: 1 })
      .limit(5)
      .lean(),
    Product.countDocuments({ hidden: { $ne: true }, stock: 0 }),
    Appointment.countDocuments({ service: { $in: clinicServiceIds }, status: 'booked', scheduledAt: { $lt: now } }),
    Order.countDocuments({ status: 'confirmed', createdAt: { $lt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) } }),
  ]);

  const alerts = [];
  if (pendingVendorApplications) {
    alerts.push({ level: 'warning', view: 'applications', title: `${pendingVendorApplications} vendor application${pendingVendorApplications === 1 ? '' : 's'} waiting`, message: 'Review new sellers and service providers.' });
  }
  if (outOfStock) {
    alerts.push({ level: 'danger', view: 'products', title: `${outOfStock} product${outOfStock === 1 ? ' is' : 's are'} out of stock`, message: 'Customers can\'t buy these until they are restocked.' });
  }
  if (lowStock.length) {
    alerts.push({ level: 'warning', view: 'products', title: 'Low stock', message: lowStock.map((p) => `${p.name} (${p.stock} left)`).join(', ') });
  }
  if (clinicNeedsUpdate) {
    alerts.push({ level: 'warning', view: 'appointments', title: `${clinicNeedsUpdate} clinic appointment${clinicNeedsUpdate === 1 ? ' needs' : 's need'} an outcome`, message: 'Mark past PawMart Clinic visits as completed or no-show.' });
  }
  if (staleOrders) {
    alerts.push({ level: 'warning', view: 'orders', title: `${staleOrders} order${staleOrders === 1 ? '' : 's'} not processed after 2 days`, message: 'These are still "Confirmed".' });
  }
  if (!env.smtp.host) {
    alerts.push({ level: 'info', title: 'Emails are not being sent', message: 'SMTP is not configured, so emails are only written to the server log.' });
  }
  if (!isCloudinaryConfigured()) {
    alerts.push({ level: 'info', title: 'Image uploads are off', message: 'Cloudinary is not configured; forms fall back to image URLs.' });
  }
  if (!env.reminders.enabled) {
    alerts.push({ level: 'info', title: 'Vaccination reminders are disabled', message: 'REMINDERS_ENABLED is false.' });
  }

  sendData(res, 200, {
    totalUsers,
    totalVendors,
    suspendedUsers,
    totalAppointments,
    pendingVendorApplications,
    totalOrders: orderTotals[0]?.count ?? 0,
    revenueCents: orderTotals[0]?.revenueCents ?? 0,
    alerts,
  });
});

// Aggregated figures for the Reports view over the last `days` days. Days are
// bucketed in the app's timezone (APP_UTC_OFFSET).
export const getReports = asyncHandler(async (req, res) => {
  const { days } = req.query;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const tz = env.appUtcOffset;
  const bucket = days > 90 ? '%Y-%m' : '%Y-%m-%d';
  const activeOrders = { createdAt: { $gte: since }, status: { $ne: 'cancelled' } };

  const [revenue, ordersByStatus, topProducts, paymentMethods, appointmentsByStatus, appointmentsByType, signups] =
    await Promise.all([
      Order.aggregate([
        { $match: activeOrders },
        { $group: { _id: { $dateToString: { format: bucket, date: '$createdAt', timezone: tz } }, revenueCents: { $sum: '$totalCents' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: activeOrders },
        { $unwind: '$items' },
        { $match: { 'items.status': { $ne: 'cancelled' } } },
        { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' }, revenueCents: { $sum: { $multiply: ['$items.priceCents', '$items.quantity'] } } } },
        { $sort: { revenueCents: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([{ $match: activeOrders }, { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenueCents: { $sum: '$totalCents' } } }]),
      Appointment.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Appointment.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 's' } },
        { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$s.type', 0] }, 'unknown'] }, count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

  const totalRevenue = revenue.reduce((sum, r) => sum + r.revenueCents, 0);
  const totalOrders = revenue.reduce((sum, r) => sum + r.orders, 0);

  sendData(res, 200, {
    days,
    bucket: days > 90 ? 'month' : 'day',
    totals: {
      revenueCents: totalRevenue,
      orders: totalOrders,
      averageOrderCents: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
      appointments: appointmentsByStatus.reduce((sum, a) => sum + a.count, 0),
      newUsers: signups.reduce((sum, u) => sum + u.count, 0),
    },
    revenue: revenue.map((r) => ({ period: r._id, revenueCents: r.revenueCents, orders: r.orders })),
    ordersByStatus: ordersByStatus.map((o) => ({ status: o._id, count: o.count })),
    topProducts: topProducts.map((p) => ({ name: p._id, quantity: p.quantity, revenueCents: p.revenueCents })),
    paymentMethods: paymentMethods.map((p) => ({ method: p._id, count: p.count, revenueCents: p.revenueCents })),
    appointmentsByStatus: appointmentsByStatus.map((a) => ({ status: a._id, count: a.count })),
    appointmentsByType: appointmentsByType.map((a) => ({ type: a._id, count: a.count })),
    signupsByRole: signups.map((u) => ({ role: u._id, count: u.count })),
  });
});

// Lets an admin trigger the daily reminder job on demand (e.g. for a demo, or
// when a sleeping free-tier server missed its scheduled run).
export const runRemindersNow = asyncHandler(async (req, res) => {
  const summary = await runVaccinationReminders();
  sendData(res, 200, summary);
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const query = status ? { status } : {};

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('items.vendorId', 'businessName')
      .lean(),
    Order.countDocuments(query),
  ]);

  const data = (await withPayments(orders)).map(({ userId, ...order }) => ({
    ...order,
    customer: userId ? { name: userId.name, email: userId.email } : null,
    items: order.items.map(({ vendorId, ...item }) => ({
      ...item,
      vendorId: vendorId?._id ?? null,
      vendorName: vendorId?.businessName ?? 'PawMart',
    })),
  }));

  sendData(res, 200, data, { page, per_page: limit, total });
});

// Admins can move any order forward (all items up to the target status) or
// cancel it at any point before delivery.
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (req.body.status === 'cancelled') {
    if (order.status === 'delivered') {
      throw ApiError.conflict('Delivered orders cannot be cancelled');
    }
    await cancelOrder(order, { byRole: 'admin' });
  } else {
    await advanceItems(order, { target: req.body.status, byRole: 'admin', stepOnly: false });
  }
  sendData(res, 200, { _id: order._id, status: order.status });
});
