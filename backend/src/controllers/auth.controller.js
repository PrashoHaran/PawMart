import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureBusinessType } from '../utils/businessType.js';

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), tokenVersion: user.tokenVersion }, env.jwtSecret, {
    expiresIn: '1d',
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });

  sendData(res, 201, { user, token: issueToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  await ensureBusinessType(user);
  sendData(res, 200, { user, token: issueToken(user) });
});

export const me = asyncHandler(async (req, res) => {
  sendData(res, 200, { user: req.user });
});
