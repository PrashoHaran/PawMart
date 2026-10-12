export function formatPriceCents(cents) {
  return (cents / 100).toFixed(2);
}

// Calendar dates (birthdays, vaccine dates) are stored as UTC midnight, so
// format them in UTC to avoid showing the previous day in negative offsets.
export function formatDate(value, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { timeZone: 'UTC', ...options });
}

// YYYY-MM-DD for <input type="date"> values.
export function toDateInputValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export function formatAge(birthDate) {
  if (!birthDate) return '';
  const born = new Date(birthDate);
  const now = new Date();
  let months = (now.getUTCFullYear() - born.getUTCFullYear()) * 12 + (now.getUTCMonth() - born.getUTCMonth());
  if (now.getUTCDate() < born.getUTCDate()) months -= 1;
  if (months < 1) return 'Under 1 mo';
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  return `${years} yr${years === 1 ? '' : 's'}`;
}
