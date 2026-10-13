import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Verifies ID tokens from "Sign in with Google".
// https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
const client = new OAuth2Client();

export function googleSignInEnabled() {
  return Boolean(env.google.clientId);
}

export async function verifyGoogleCredential(credential) {
  let payload;
  try {
    // Checks the signature, expiry, issuer and that the token was issued
    // for PawMart's client ID (audience).
    const ticket = await client.verifyIdToken({ idToken: credential, audience: env.google.clientId });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Google sign-in could not be verified. Please try again.');
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw ApiError.unauthorized('Your Google account email is not verified.');
  }

  const email = payload.email.toLowerCase();
  return {
    googleId: payload.sub,
    email,
    name: payload.name || email.split('@')[0],
    picture: payload.picture || '',
    // Google is authoritative for Gmail addresses and verified Workspace domains.
    emailAuthoritative: email.endsWith('@gmail.com') || Boolean(payload.hd),
  };
}
