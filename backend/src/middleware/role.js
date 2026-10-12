import { ApiError } from '../utils/ApiError.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}

export function requireServiceProvider(req, res, next) {
  if (req.user.role !== 'vendor' || req.user.businessType !== 'service_provider') {
    return next(ApiError.forbidden('Only approved service providers can do this'));
  }
  next();
}
