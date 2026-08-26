import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { category, search, page, limit } = req.query;

  const filter = {};
  if (category && category !== 'All') {
    filter.category = category;
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  sendData(res, 200, products, { page, per_page: limit, total });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  sendData(res, 200, product);
});
