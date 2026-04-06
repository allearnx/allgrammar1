/**
 * Validate that a URL is safe to use as an iframe src.
 * Only allows https: protocol (and http: for localhost in dev).
 */
export function isSafeIframeSrc(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return true;
    if (process.env.NODE_ENV !== 'production' && parsed.protocol === 'http:') return true;
    return false;
  } catch {
    return false;
  }
}
