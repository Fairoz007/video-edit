/** Client-side http(s) URL check for article / YouTube inputs. */
export function isValidHttpUrl(value?: string): boolean {
  if (!value?.trim()) return true;
  const trimmed = value.trim();
  if (trimmed.startsWith('#')) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeHttpUrlInput(value?: string): string | undefined {
  if (!value?.trim() || !isValidHttpUrl(value)) return undefined;
  return value.trim();
}
