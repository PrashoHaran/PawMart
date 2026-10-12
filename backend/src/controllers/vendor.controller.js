import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Review } from '../models/Review.js';
import { advanceItems, withPayments } from '../services/orderFulfilment.js';
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
  await Review.deleteMany({ productId: product._id });
  sendData(res, 200, { deleted: true });
});

export const getMyVendorStats = asyncHandler(async (req, res) => {
  const productIds = await Product.find({ vendorId: req.user._id }).distinct('_id');
  const activeProductCount = productIds.length;

  const [salesSummary] = await Order.aggregate([
    { $match: { 'items.product': { $in: productIds }, status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    { $match: { 'items.product': { $in: productIds }, 'items.status': { $ne: 'cancelled' } } },
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

// Orders containing this vendor's products. Matches on the vendorId snapshot
// and, for orders placed before it existed, on the vendor's current products.
async function vendorOrderFilter(vendorId) {
  const productIds = await Product.find({ vendorId }).distinct('_id');
  return {
    productIds,
    filter: { $or: [{ 'items.vendorId': vendorId }, { 'items.product': { $in: productIds } }] },
  };
}

function isVendorItem(vendorId, productIds) {
  const ids = new Set(productIds.map(String));
  return (item) => (item.vendorId ? item.vendorId.equals(vendorId) : ids.has(String(item.product)));
}

export const listMyOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const { productIds, filter } = await vendorOrderFilter(req.user._id);
  const query = status ? { ...filter, status } : filter;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email')
      .lean(),
    Order.countDocuments(query),
  ]);

  const isMine = isVendorItem(req.user._id, productIds);
  const data = (await withPayments(orders)).map(({ userId, ...order }) => {
    const items = order.items.filter(isMine);
    return {
      ...order,
      customer: userId ? { name: userId.name, email: userId.email } : null,
      items,
      vendorSubtotalCents: items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    };
  });

  sendData(res, 200, data, { page, per_page: limit, total });
});

export const updateMyOrderStatus = asyncHandler(async (req, res) => {
  const { productIds, filter } = await vendorOrderFilter(req.user._id);
  const order = await Order.findOne({ _id: req.params.id, ...filter });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  if (req.body.status === 'cancelled') {
    throw ApiError.forbidden('Vendors cannot cancel orders; ask the customer or an admin');
  }

  await advanceItems(order, {
    target: req.body.status,
    byRole: 'vendor',
    isMine: isVendorItem(req.user._id, productIds),
  });
  sendData(res, 200, { _id: order._id, status: order.status });
});
