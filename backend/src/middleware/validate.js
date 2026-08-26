import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.badRequest('Invalid input', details));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.badRequest('Invalid query parameters', details));
    }
    req.query = result.data;
    next();
  };
}

export function validateObjectId(paramName) {
  return (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[paramName])) {
      return next(ApiError.badRequest(`Invalid ${paramName}`));
    }
    next();
  };
}
