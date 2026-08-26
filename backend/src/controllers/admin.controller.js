import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import { VendorApplication } from '../models/VendorApplication.js';
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
