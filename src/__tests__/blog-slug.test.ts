import { describe, it, expect } from 'vitest';
import { generateSlug, romanizeKorean } from '@/lib/blog/generate-slug';

describe('generateSlug — 한글 제목도 읽을 수 있는 주소로', () => {
  it('한글을 로마자로 옮긴다', () => {
    expect(romanizeKorean('동아윤')).toBe('dongayun');
    expect(generateSlug('중1 동아윤 5-6과 기출문제')).toBe('jung1-dongayun-5-6gwa-gichulmunje');
  });
  it('비슷하지만 다른 제목은 다른 주소가 된다 (숫자만 남던 사고 방지)', () => {
    const a = generateSlug('중1 동아윤 5-6과 서술형 기출문제 모음');
    const b = generateSlug('중1 동아윤 5-6과 기출문제 3종 무료 나눔');
    expect(a).not.toBe(b);
    expect(a).not.toBe('1-5-6');
  });
  it('영어 제목은 그대로 유지', () => {
    expect(generateSlug('How to Study English')).toBe('how-to-study-english');
  });
  it('기호만 있는 제목은 시각 기반 주소', () => {
    expect(generateSlug('!!! ???')).toMatch(/^post-\d+-[a-z0-9]+$/);
  });
  it('아주 긴 제목도 80자 이내', () => {
    expect(generateSlug('중학교 1학년 영어 내신 대비 기출문제 모음집 완전 정복 가이드 총정리 무료 배포 자료').length).toBeLessThanOrEqual(80);
  });
});
