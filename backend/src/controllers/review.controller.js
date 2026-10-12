import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Recompute the product's average rating and review count from its reviews.
async function refreshProductRating(productId) {
  const [stats] = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Product.updateOne(
    { _id: productId },
    {
      rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
      reviewCount: stats ? stats.count : 0,
    }
  );
}

function hasPurchased(userId, productId) {
  return Order.exists({ userId, status: 'confirmed', 'items.product': productId });
}

async function findProductOr404(productId) {
  const product = await Product.exists({ _id: productId });
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
}

export const listReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;

  await findProductOr404(id);

  const [reviews, total] = await Promise.all([
    Review.find({ productId: id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments({ productId: id }),
  ]);

  sendData(res, 200, reviews, { page, per_page: limit, total });
});

export const getReviewEligibility = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await findProductOr404(id);

  const [myReview, purchased] = await Promise.all([
    Review.findOne({ productId: id, userId: req.user._id }).lean(),
    hasPurchased(req.user._id, id),
  ]);

  let reason = null;
  if (req.user.role !== 'customer') reason = 'Only customers can review products';
  else if (myReview) reason = 'You have already reviewed this product';
  else if (!purchased) reason = 'Only customers who purchased this product can review it';

  sendData(res, 200, { canReview: reason === null, reason, myReview });
});

export const createReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await findProductOr404(id);

  if (!(await hasPurchased(req.user._id, id))) {
    throw ApiError.forbidden('Only customers who purchased this product can review it');
  }

  if (await Review.exists({ productId: id, userId: req.user._id })) {
    throw ApiError.conflict('You have already reviewed this product');
  }

  const review = await Review.create({
    productId: id,
    userId: req.user._id,
    userName: req.user.name,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  await refreshProductRating(id);

  sendData(res, 201, review);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  const isOwner = review.userId.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own reviews');
  }

  await review.deleteOne();
  await refreshProductRating(review.productId);

  res.status(204).end();
});
