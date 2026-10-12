import { VendorApplication } from '../models/VendorApplication.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const applyForVendor = asyncHandler(async (req, res) => {
  if (req.user.role === 'vendor') {
    throw ApiError.badRequest('You are already a vendor');
  }

  const existingPending = await VendorApplication.findOne({
    userId: req.user._id,
    status: 'pending',
  });
  if (existingPending) {
    throw ApiError.conflict('You already have a pending vendor application');
  }

  const application = await VendorApplication.create({
    userId: req.user._id,
    businessName: req.body.businessName,
    businessType: req.body.businessType,
  });

  sendData(res, 201, application);
});

export const getMyVendorApplication = asyncHandler(async (req, res) => {
  const application = await VendorApplication.findOne({ userId: req.user._id }).sort({
    createdAt: -1,
  });
  sendData(res, 200, application);
});

export const listPendingVendorApplications = asyncHandler(async (req, res) => {
  const applications = await VendorApplication.find({ status: 'pending' })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  sendData(res, 200, applications);
});

export const approveVendorApplication = asyncHandler(async (req, res) => {
  const application = await VendorApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }
  if (application.status !== 'pending') {
    throw ApiError.conflict('Application has already been reviewed');
  }

  application.status = 'approved';
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  await application.save();

  await User.updateOne(
    { _id: application.userId },
    {
      role: 'vendor',
      businessName: application.businessName,
      businessType: application.businessType,
      $inc: { tokenVersion: 1 },
    }
  );

  sendData(res, 200, application);
});

export const rejectVendorApplication = asyncHandler(async (req, res) => {
  const application = await VendorApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }
  if (application.status !== 'pending') {
    throw ApiError.conflict('Application has already been reviewed');
  }

  application.status = 'rejected';
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  application.rejectionReason = req.body.rejectionReason;
  await application.save();

  sendData(res, 200, application);
});
