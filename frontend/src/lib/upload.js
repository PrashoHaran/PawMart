import { apiRequest } from './api';

let configPromise = null;

// Whether the server has Cloudinary configured; fetched once per session.
export function getUploadConfig(token) {
  if (!configPromise) {
    configPromise = apiRequest('/uploads/config', { token })
      .then(({ data }) => data)
      .catch((err) => {
        configPromise = null;
        throw err;
      });
  }
  return configPromise;
}

// Uploads an image straight from the browser to Cloudinary using a
// short-lived signature from our API, and returns the hosted HTTPS URL.
export async function uploadImage(file, purpose, token) {
  const { data: sig } = await apiRequest('/uploads/signature', {
    method: 'POST',
    token,
    body: { purpose },
  });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', sig.timestamp);
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);
  formData.append('allowed_formats', sig.allowed_formats);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error?.message || 'Image upload failed');
  }
  return payload.secure_url;
}
