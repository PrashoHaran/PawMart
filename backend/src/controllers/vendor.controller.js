import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ vendorId: req.user._id }).sort({ createdAt: -1 }).lean();
  sendData(res, 200, products);
});

export const createMyProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    ...req.body,
    vendorId: req.user._id,
    vendorName: req.user.businessName,
  });
  sendData(res, 201, product);
});

export const updateMyProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, vendorId: req.user._id },
    req.body,
    { new: true }
  );
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  sendData(res, 200, product);
});

export const deleteMyProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, vendorId: req.user._id });
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  sendData(res, 200, { deleted: true });
});

export const getMyVendorStats = asyncHandler(async (req, res) => {
  const productIds = await Product.find({ vendorId: req.user._id }).distinct('_id');
  const activeProductCount = productIds.length;

  const [salesSummary] = await Order.aggregate([
    { $match: { 'items.product': { $in: productIds } } },
    { $unwind: '$items' },
    { $match: { 'items.product': { $in: productIds } } },
    {
      $group: {
        _id: null,
        totalSalesCents: { $sum: { $multiply: ['$items.priceCents', '$items.quantity'] } },
        orderIds: { $addToSet: '$_id' },
      },
    },
    { $project: { totalSalesCents: 1, orderCount: { $size: '$orderIds' } } },
  ]);

  sendData(res, 200, {
    activeProductCount,
    totalSalesCents: salesSummary?.totalSalesCents || 0,
    orderCount: salesSummary?.orderCount || 0,
  });
});
