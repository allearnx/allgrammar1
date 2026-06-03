import { describe, it, expect } from 'vitest';
import {
  keepBestScore,
  isVocabCompleted,
  buildVocabProgressUpdates,
  buildVocaQuizUpdate,
  buildVocaSpellingUpdate,
} from '@/lib/progress-helpers';

describe('keepBestScore', () => {
  it('새 점수가 더 높으면 새 점수를 반환한다', () => {
    expect(keepBestScore(97, 90)).toBe(97);
  });

  it('기존 점수가 더 높으면 기존 점수를 유지한다', () => {
    expect(keepBestScore(90, 97)).toBe(97);
  });

  it('같은 점수면 그대로 반환한다', () => {
    expect(keepBestScore(85, 85)).toBe(85);
  });

  it('기존 점수가 null이면 새 점수를 반환한다', () => {
    expect(keepBestScore(70, null)).toBe(70);
  });

  it('기존 점수가 undefined이면 새 점수를 반환한다', () => {
    expect(keepBestScore(70, undefined)).toBe(70);
  });

  it('새 점수가 0이고 기존이 없으면 0을 반환한다', () => {
    expect(keepBestScore(0, null)).toBe(0);
  });
});

describe('isVocabCompleted', () => {
  it('quiz, spelling 모두 80 이상이면 완료', () => {
    expect(isVocabCompleted(80, 80)).toBe(true);
  });

  it('quiz만 80 이상이면 미완료', () => {
    expect(isVocabCompleted(90, 70)).toBe(false);
  });

  it('spelling만 80 이상이면 미완료', () => {
    expect(isVocabCompleted(70, 90)).toBe(false);
  });

  it('둘 다 80 미만이면 미완료', () => {
    expect(isVocabCompleted(50, 60)).toBe(false);
  });
});

describe('buildVocabProgressUpdates', () => {
  it('quiz 97점 후 90점 → 97점 유지', () => {
    const existing = { vocab_quiz_score: 97, vocab_spelling_score: 85 };
    const { updates } = buildVocabProgressUpdates('quiz', 90, undefined, existing);
    expect(updates.vocab_quiz_score).toBe(97);
  });

  it('quiz 90점 후 97점 → 97점으로 갱신', () => {
    const existing = { vocab_quiz_score: 90, vocab_spelling_score: 85 };
    const { updates } = buildVocabProgressUpdates('quiz', 97, undefined, existing);
    expect(updates.vocab_quiz_score).toBe(97);
  });

  it('spelling 80점 후 60점 → 80점 유지', () => {
    const existing = { vocab_quiz_score: 90, vocab_spelling_score: 80 };
    const { updates } = buildVocabProgressUpdates('spelling', 60, undefined, existing);
    expect(updates.vocab_spelling_score).toBe(80);
  });

  it('첫 시도 (existing null) → 점수 그대로 저장', () => {
    const { updates } = buildVocabProgressUpdates('quiz', 75, undefined, null);
    expect(updates.vocab_quiz_score).toBe(75);
  });

  it('quiz 80+, spelling 80+ → 완료 판정', () => {
    const existing = { vocab_quiz_score: 85, vocab_spelling_score: 90 };
    const { vocabCompleted } = buildVocabProgressUpdates('quiz', 80, undefined, existing);
    expect(vocabCompleted).toBe(true);
  });

  it('quiz 90점이지만 spelling 70점 → 미완료', () => {
    const existing = { vocab_quiz_score: 0, vocab_spelling_score: 70 };
    const { vocabCompleted } = buildVocabProgressUpdates('quiz', 90, undefined, existing);
    expect(vocabCompleted).toBe(false);
  });
});

describe('buildVocaQuizUpdate (올킬보카)', () => {
  it('100점 후 97점 → 100점 유지', () => {
    const existing = { quiz_score: 100 };
    const updates = buildVocaQuizUpdate(97, false, existing);
    expect(updates.quiz_score).toBe(100);
  });

  it('75점 후 90점 → 90점으로 갱신', () => {
    const existing = { quiz_score: 75 };
    const updates = buildVocaQuizUpdate(90, false, existing);
    expect(updates.quiz_score).toBe(90);
  });

  it('round2도 최고점 유지', () => {
    const existing = { round2_quiz_score: 88 };
    const updates = buildVocaQuizUpdate(70, true, existing);
    expect(updates.round2_quiz_score).toBe(88);
  });

  it('첫 시도 (existing null) → 점수 그대로', () => {
    const updates = buildVocaQuizUpdate(65, false, null);
    expect(updates.quiz_score).toBe(65);
  });
});

describe('buildVocaSpellingUpdate (올킬보카)', () => {
  it('90점 후 80점 → 90점 유지', () => {
    const existing = { spelling_score: 90 };
    const updates = buildVocaSpellingUpdate(80, existing);
    expect(updates.spelling_score).toBe(90);
  });

  it('70점 후 95점 → 95점으로 갱신', () => {
    const existing = { spelling_score: 70 };
    const updates = buildVocaSpellingUpdate(95, existing);
    expect(updates.spelling_score).toBe(95);
  });
});
