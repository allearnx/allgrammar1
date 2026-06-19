import { describe, it, expect } from 'vitest';
import { extractVideoId } from '@/lib/utils/youtube';

// 실제 YouTube video id는 항상 11자(영숫자·_·-).
describe('extractVideoId', () => {
  it('extracts ID from youtube.com/watch?v= URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtu.be short URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('strips ?si= share tracking param from youtu.be URL', () => {
    // 본문 설명 영상이 안 열리던 실제 버그: ?si= 가 id에 섞여 임베드 실패
    expect(extractVideoId('https://youtu.be/QYwlgY6-hNE?si=RpASpXUdvncBeVwi')).toBe('QYwlgY6-hNE');
  });

  it('ignores extra query parameters after v=', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120')).toBe('dQw4w9WgXcQ');
  });

  it('extracts v= even when other params come first', () => {
    expect(extractVideoId('https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from embed URL', () => {
    expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from shorts URL', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from live URL', () => {
    expect(extractVideoId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for empty string', () => {
    expect(extractVideoId('')).toBeNull();
  });

  it('returns null for non-YouTube URL', () => {
    expect(extractVideoId('https://example.com/video')).toBeNull();
  });

  it('returns null for YouTube URL without a video id', () => {
    expect(extractVideoId('https://www.youtube.com/channel/UCxyz')).toBeNull();
  });
});
