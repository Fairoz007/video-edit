/**
 * Validate user-supplied http(s) URLs before fetch / scrape / new URL().
 */
export function isValidHttpUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('#')) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeHttpUrl(value) {
  if (!isValidHttpUrl(value)) return null;
  return value.trim();
}
