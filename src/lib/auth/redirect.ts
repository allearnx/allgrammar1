/**
 * Validate that a redirect target is a safe internal path.
 * Blocks open-redirect attacks (external URLs, protocol-relative URLs).
 */
export function isSafeRedirect(next: string | null): next is string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return false;
  try {
    return new URL(next, 'http://localhost').host === 'localhost';
  } catch {
    return false;
  }
}
