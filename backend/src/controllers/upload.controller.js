import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/ApiResponse.js';
import { createUploadSignature, isCloudinaryConfigured, ALLOWED_IMAGE_FORMATS } from '../utils/cloudinary.js';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Which roles may upload for each purpose, and the folder the image lands in.
const PURPOSES = {
  product: { roles: ['vendor', 'admin'], folder: () => 'pawmart/products' },
  pet: { roles: ['customer', 'vendor', 'admin'], folder: (user) => `pawmart/pets/${user._id}` },
};

export function getUploadConfig(req, res) {
  sendData(res, 200, {
    enabled: isCloudinaryConfigured(),
    maxBytes: MAX_UPLOAD_BYTES,
    allowedFormats: ALLOWED_IMAGE_FORMATS,
  });
}

export function createSignature(req, res) {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, 'UPLOADS_DISABLED', 'Image uploads are not configured on this server');
  }

  const purpose = PURPOSES[req.body.purpose];
  if (!purpose.roles.includes(req.user.role)) {
    throw ApiError.forbidden('You cannot upload images for this purpose');
  }

  sendData(res, 200, createUploadSignature(purpose.folder(req.user)));
}
