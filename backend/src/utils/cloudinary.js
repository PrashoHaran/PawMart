import crypto from 'node:crypto';
import { env } from '../config/env.js';

export const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

export function isCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  return Boolean(cloudName && apiKey && apiSecret);
}

// Cloudinary's upload signature: the params sorted by key, joined as
// key=value&..., with the API secret appended, hashed with SHA-1.
// https://cloudinary.com/documentation/authentication_signatures
export function signParams(params, apiSecret = env.cloudinary.apiSecret) {
  const toSign = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== '')
    .sort()
    .map((key) => `${key}=${Array.isArray(params[key]) ? params[key].join(',') : params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
}

export function createUploadSignature(folder) {
  const params = {
    allowed_formats: ALLOWED_IMAGE_FORMATS.join(','),
    folder,
    timestamp: Math.floor(Date.now() / 1000),
  };
  return {
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    signature: signParams(params),
    ...params,
  };
}
