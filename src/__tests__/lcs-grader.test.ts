import { describe, it, expect } from 'vitest';
import { normalize, lcsLength, gradeAnswerLCS, getFeedbackLCS } from '@/lib/utils/lcs-grader';

describe('normalize', () => {
  it('converts to lowercase', () => {
    expect(normalize('Hello World')).toBe('hello world');
  });

  it('removes special characters but keeps apostrophes', () => {
    expect(normalize("I can't do it.")).toBe("i can't do it");
    expect(normalize('Hello, World!')).toBe('hello world');
  });

  it('collapses multiple spaces into one', () => {
    expect(normalize('hello   world')).toBe('hello world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalize('  hello world  ')).toBe('hello world');
  });

  it('returns empty string for empty input', () => {
    expect(normalize('')).toBe('');
  });
});

describe('lcsLength', () => {
  it('returns full length for identical arrays', () => {
    expect(lcsLength(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(3);
  });

  it('returns 0 for completely different arrays', () => {
    expect(lcsLength(['a', 'b'], ['x', 'y'])).toBe(0);
  });

  it('finds partial match preserving order', () => {
    expect(lcsLength(['a', 'b', 'c', 'd'], ['a', 'c', 'd'])).toBe(3);
  });

  it('returns 0 for empty arrays', () => {
    expect(lcsLength([], ['a', 'b'])).toBe(0);
    expect(lcsLength(['a'], [])).toBe(0);
    expect(lcsLength([], [])).toBe(0);
  });
});

describe('gradeAnswerLCS', () => {
  it('returns 100 for exact match', () => {
    expect(gradeAnswerLCS('Hello World', 'Hello World')).toBe(100);
  });

  it('returns 100 when only case/punctuation differ', () => {
    expect(gradeAnswerLCS('Hello, World!', 'hello world')).toBe(100);
  });

  it('deducts proportionally for missing words', () => {
    // original has 4 words, student has 3 matching → 75
    expect(gradeAnswerLCS('I love my cat', 'I love cat')).toBe(75);
  });

  it('returns 0 for completely different answer', () => {
    expect(gradeAnswerLCS('hello world', 'foo bar')).toBe(0);
  });

  it('returns 0 for empty original', () => {
    expect(gradeAnswerLCS('', 'some answer')).toBe(0);
  });

  it('handles empty student answer', () => {
    expect(gradeAnswerLCS('hello world', '')).toBe(0);
  });

  it('gives partial score for reordered words', () => {
    // "the cat sat on the mat" vs "mat the on sat cat the"
    // LCS picks longest ordered subsequence
    const score = gradeAnswerLCS('the cat sat on the mat', 'mat the on sat cat the');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it('never exceeds 100', () => {
    // student repeats words — matchedCount can't exceed origWords.length
    const score = gradeAnswerLCS('hello', 'hello hello hello');
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('getFeedbackLCS', () => {
  it('returns perfect feedback for 100', () => {
    expect(getFeedbackLCS(100)).toBe('완벽합니다!');
  });

  it('returns near-perfect feedback for 90–99', () => {
    expect(getFeedbackLCS(90)).toBe('거의 맞았어요! 조금만 더 확인해보세요.');
    expect(getFeedbackLCS(99)).toBe('거의 맞았어요! 조금만 더 확인해보세요.');
  });

  it('returns good feedback for 70–89', () => {
    expect(getFeedbackLCS(70)).toBe('잘 쓰고 있어요. 빠진 부분을 확인하세요.');
    expect(getFeedbackLCS(89)).toBe('잘 쓰고 있어요. 빠진 부분을 확인하세요.');
  });

  it('returns half feedback for 50–69', () => {
    expect(getFeedbackLCS(50)).toBe('절반 이상 맞았어요. 원문을 다시 확인하세요.');
    expect(getFeedbackLCS(69)).toBe('절반 이상 맞았어요. 원문을 다시 확인하세요.');
  });

  it('returns retry feedback for 0–49', () => {
    expect(getFeedbackLCS(0)).toBe('원문을 다시 읽고 도전해보세요.');
    expect(getFeedbackLCS(49)).toBe('원문을 다시 읽고 도전해보세요.');
  });
});
