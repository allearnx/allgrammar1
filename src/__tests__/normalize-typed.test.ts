import { describe, it, expect } from 'vitest';
import { normalizeTyped } from '@/lib/voca/normalize-typed';
import { isRelatedCorrect } from '@/lib/voca/round2-exam';

describe('normalizeTyped — 타이핑 답안 유니코드 정규화', () => {
  it('아이폰 곱슬 아포스트로피(U+2019)를 직선으로 (능률중등고난도 Day9 실사례)', () => {
    expect(normalizeTyped('praise to one’s face')).toBe("praise to one's face");
  });

  it('여는 곱슬 따옴표(U+2018)·백틱·어큐트도 직선으로', () => {
    expect(normalizeTyped('‘one`s´')).toBe("'one's'");
  });

  it('곱슬 큰따옴표를 직선으로', () => {
    expect(normalizeTyped('“hello”')).toBe('"hello"');
  });

  it('엔대시/엠대시를 하이픈으로', () => {
    expect(normalizeTyped('well–known—word')).toBe('well-known-word');
  });

  it('특수 공백(NBSP/zero-width/전각)을 일반 공백으로', () => {
    expect(normalizeTyped('a b​c　d')).toBe('a b c d');
  });

  it('대소문자·앞뒤/중복 공백 무시', () => {
    expect(normalizeTyped('  Give  Up  ')).toBe('give up');
  });

  it('알파벳 s를 지우지 않는다 (\\s 이스케이프 회귀 방지)', () => {
    expect(normalizeTyped('Mass press')).toBe('mass press');
  });
});

describe('isRelatedCorrect — 반의어/유의어 시험 채점', () => {
  it('곱슬 아포스트로피로 입력해도 정답 인정', () => {
    expect(isRelatedCorrect('praise to one’s face', ["praise to one's face"])).toBe(true);
  });

  it('정답 후보 쪽에 곱슬 아포스트로피가 있어도 인정', () => {
    expect(isRelatedCorrect("praise to one's face", ['praise to one’s face'])).toBe(true);
  });

  it('오답은 여전히 오답', () => {
    expect(isRelatedCorrect('talk behind', ["praise to one's face"])).toBe(false);
  });
});
