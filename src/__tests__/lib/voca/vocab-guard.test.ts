import { describe, it, expect } from 'vitest';
import { isValidFrontText, filterVocabItems } from '@/lib/voca/vocab-guard';

describe('vocab-guard — 표제어 오염 방지', () => {
  it('일반 영단어·구동사·숙어는 허용', () => {
    expect(isValidFrontText('humble')).toBe(true);
    expect(isValidFrontText('bring up')).toBe(true);
    expect(isValidFrontText("make up one's mind")).toBe(true);
    expect(isValidFrontText('as soon as possible')).toBe(true);
  });

  it('실존 콘텐츠의 문형 표기(한글 문법 용어 1~2개)는 허용', () => {
    expect(isValidFrontText('willing to + 동사원형')).toBe(true);
    expect(isValidFrontText('be more likely to + 동사원형')).toBe(true);
    expect(isValidFrontText('rush+to부정사')).toBe(true);
  });

  it('실사고 사례: AI 대화체 응답 문장은 거부 (2026-07-19)', () => {
    expect(isValidFrontText('새로 주신 단어 30개를 요청하신 형식(<영어')).toBe(false);
  });

  it('한국어 문장(한글 토큰 3개 이상)·형식 문자·장문·과다 단어수 거부', () => {
    expect(isValidFrontText('단어 목록이 비어 있어요')).toBe(false);
    expect(isValidFrontText('<영어> (한국어) 형식')).toBe(false);
    expect(isValidFrontText('{"word": "apple"}')).toBe(false);
    expect(isValidFrontText('this is a very long sentence that should never be a headword')).toBe(false);
    expect(isValidFrontText('')).toBe(false);
  });

  it('filterVocabItems — 오염 항목만 걸러내고 유효분 유지', () => {
    const { valid, skipped } = filterVocabItems([
      { front_text: 'humble' },
      { front_text: '새로 주신 단어 30개를 요청하신 형식(<영어' },
      { front_text: 'bring up' },
    ]);
    expect(valid.map((v) => v.front_text)).toEqual(['humble', 'bring up']);
    expect(skipped).toHaveLength(1);
  });
});
