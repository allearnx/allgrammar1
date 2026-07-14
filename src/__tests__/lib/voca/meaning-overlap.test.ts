import { describe, it, expect } from 'vitest';
import { meaningTokens, hasMeaningOverlap } from '@/lib/voca/meaning-overlap';

describe('meaning-overlap', () => {
  it('품사 태그·구두점을 걷어내고 토큰으로 분해한다', () => {
    const tokens = meaningTokens('[동] 새끼를 낳다, 기르다  [명] 품종');
    expect(tokens.has('기르다')).toBe(true);
    expect(tokens.has('품종')).toBe(true);
    expect(tokens.has('[동]')).toBe(false);
  });

  it('실사례: bred ↔ bring up ↔ nurture 뜻 겹침을 잡는다', () => {
    const bred = '[동] 새끼를 낳다, 기르다  [명] 품종';
    const bringUp = '~을 기르다, 양육하다';
    const nurture = '[동] 양육하다, 키우다';
    expect(hasMeaningOverlap(bred, bringUp)).toBe(true);      // 기르다 공유
    expect(hasMeaningOverlap(nurture, bringUp)).toBe(true);   // 양육하다 공유
  });

  it('조사 접두(~을)를 제거하고 비교한다', () => {
    expect(hasMeaningOverlap('기르다, 양육하다', '~을 기르다')).toBe(true);
  });

  it('뜻이 다른 단어는 겹침으로 판정하지 않는다', () => {
    expect(hasMeaningOverlap('[명] 배우자, 남편, 아내', '[명] 장례식')).toBe(false);
    expect(hasMeaningOverlap('[동] 축하하다, 기념하다', '[명] 기념일')).toBe(false); // 기념하다≠기념일
    expect(hasMeaningOverlap('[형] 탁아소의, 보육의', '[형] 임신한')).toBe(false);
  });

  it('빈 문자열·태그만 있는 뜻은 겹침 없음', () => {
    expect(hasMeaningOverlap('', '기르다')).toBe(false);
    expect(hasMeaningOverlap('[동]', '[동] 기르다')).toBe(false);
  });
});
