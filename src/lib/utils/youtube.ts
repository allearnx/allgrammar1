export function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|v=)([^&\s]+)/);
  return match ? match[1] : null;
}
