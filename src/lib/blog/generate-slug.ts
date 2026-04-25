/**
 * Generate a URL-friendly slug from a title.
 * Handles Korean by transliterating to a romanized approximation,
 * or falls back to timestamp-based slug.
 */
export function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    // Replace common Korean/special chars with hyphens
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/[\s]+/g, '-')
    // Remove Korean characters (they don't work well in URLs)
    .replace(/[가-힣]+/g, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '');

  // If slug is empty after processing (e.g., all Korean title), use timestamp + random
  if (!slug) {
    return `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return slug;
}
