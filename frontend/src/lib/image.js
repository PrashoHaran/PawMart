const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
      '<rect width="400" height="400" fill="#f3f4f6"/>' +
      '<path d="M150 145h100a12 12 0 0 1 12 12v110l-32-32-24 24-46-46-42 42v-98a12 12 0 0 1 12-12z" fill="#d1d5db"/>' +
      '<circle cx="175" cy="180" r="14" fill="#d1d5db"/>' +
      '</svg>'
  );

// Swaps a broken <img> to a neutral placeholder instead of leaving alt text
// overlapping surrounding content, which is how failed loads render by default.
export function handleImageError(e) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMAGE;
}

// Adds Cloudinary delivery transformations (resize, auto format/quality) to
// Cloudinary URLs; other URLs (e.g. seeded Unsplash images) pass through.
export function optimizedImage(url, width) {
  if (!url || !url.includes('res.cloudinary.com/') || !url.includes('/image/upload/')) return url;
  return url.replace('/image/upload/', `/image/upload/c_limit,w_${width},f_auto,q_auto/`);
}
