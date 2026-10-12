import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import { VendorApplication } from '../models/VendorApplication.js';
import { Order } from '../models/Order.js';
import { advanceItems, cancelOrder, withPayments } from '../services/orderFulfilment.js';
import { ApiError } from '../utils/ApiError.js';
import { runVaccinationReminders } from '../jobs/vaccinationReminders.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalVendors, totalAppointments, pendingVendorApplications] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'vendor' }),
      Appointment.countDocuments({ status: 'booked' }),
      VendorApplication.countDocuments({ status: 'pending' }),
    ]);

  sendData(res, 200, { totalUsers, totalVendors, totalAppointments, pendingVendorApplications });
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
