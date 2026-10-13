import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureBusinessType } from '../utils/businessType.js';
import { googleSignInEnabled, verifyGoogleCredential } from '../services/googleAuth.js';

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), tokenVersion: user.tokenVersion }, env.jwtSecret, {
    expiresIn: '1d',
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing?.googleId && !existing.passwordHash) {
    throw ApiError.conflict('This email is registered with Google. Use "Continue with Google" to sign in.');
  }
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

  if (!user.passwordHash) {
    throw ApiError.unauthorized('This account uses Google sign-in. Use "Continue with Google" instead.');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (user.status === 'suspended') {
    throw ApiError.forbidden('This account has been suspended. Contact PawMart support for help.');
  }

  await ensureBusinessType(user);
  sendData(res, 200, { user, token: issueToken(user) });
});

export const me = asyncHandler(async (req, res) => {
  sendData(res, 200, { user: req.user });
});

export const authConfig = (req, res) => {
  sendData(res, 200, { google: { enabled: googleSignInEnabled(), clientId: googleSignInEnabled() ? env.google.clientId : null } });
};

// Sign in (or sign up) with a Google ID token from the "Sign in with Google"
// button. Users are matched by Google account ID (`sub`), never by email alone.
export const googleLogin = asyncHandler(async (req, res) => {
  if (!googleSignInEnabled()) {
    throw new ApiError(503, 'GOOGLE_DISABLED', 'Google sign-in is not configured on this server');
  }

  const profile = await verifyGoogleCredential(req.body.credential);

  let user = await User.findOne({ googleId: profile.googleId });
  let created = false;

  if (!user) {
    const existing = await User.findOne({ email: profile.email });
    if (existing) {
      // Link only when Google is authoritative for the address (Gmail or a
      // verified Google Workspace domain); otherwise make the person prove
      // they own the PawMart account by signing in with its password.
      if (!profile.emailAuthoritative) {
        throw ApiError.conflict(
          'A PawMart account with this email already exists. Sign in with your password instead.'
        );
      }
      existing.googleId = profile.googleId;
      if (!existing.avatarUrl && profile.picture) existing.avatarUrl = profile.picture;
      await existing.save();
      user = existing;
    } else {
      user = await User.create({
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        avatarUrl: profile.picture,
      });
      created = true;
    }
  }

  if (user.status === 'suspended') {
    throw ApiError.forbidden('This account has been suspended. Contact PawMart support for help.');
  }

  await ensureBusinessType(user);
  sendData(res, created ? 201 : 200, { user, token: issueToken(user), created });
});
