import { describe, it, expect } from 'vitest';
import { extractVideoId } from '@/lib/utils/youtube';

describe('extractVideoId', () => {
  it('extracts ID from youtube.com/watch?v= URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=ABC123')).toBe('ABC123');
  });

  it('extracts ID from youtu.be short URL', () => {
    expect(extractVideoId('https://youtu.be/ABC123')).toBe('ABC123');
  });

  it('ignores extra query parameters after v=', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=ABC123&t=120')).toBe('ABC123');
  });

  it('extracts v= even when other params come first', () => {
    expect(extractVideoId('https://www.youtube.com/watch?list=PL123&v=ABC123')).toBe('ABC123');
  });

  it('returns null for empty string', () => {
    expect(extractVideoId('')).toBeNull();
  });

  it('returns null for non-YouTube URL', () => {
    expect(extractVideoId('https://example.com/video')).toBeNull();
  });

  it('returns null for YouTube URL without v= parameter', () => {
    expect(extractVideoId('https://www.youtube.com/channel/UCxyz')).toBeNull();
  });
});
