import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import { VendorApplication } from '../models/VendorApplication.js';
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
