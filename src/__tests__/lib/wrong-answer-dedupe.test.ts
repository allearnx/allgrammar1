import { describe, it, expect } from 'vitest';
import {
  isBlankWrongAnswer,
  wrongAnswerKey,
  cleanWrongAnswers,
} from '@/lib/naesin/wrong-answer-dedupe';

describe('isBlankWrongAnswer', () => {
  it('빈 문자열·공백·구두점만 있는 답은 빈 답', () => {
    expect(isBlankWrongAnswer({ type: 'fill_blank', userAnswer: '' })).toBe(true);
    expect(isBlankWrongAnswer({ type: 'fill_blank', userAnswer: '   ' })).toBe(true);
    expect(isBlankWrongAnswer({ type: 'translation', userAnswer: '.' })).toBe(true);
    expect(isBlankWrongAnswer({ type: 'translation', userAnswer: '...' })).toBe(true);
    expect(isBlankWrongAnswer({ type: 'translation', userAnswer: '-' })).toBe(true);
    expect(isBlankWrongAnswer({ type: 'translation', userAnswer: null })).toBe(true);
  });

  it('내용이 있는 답은 빈 답이 아님', () => {
    expect(isBlankWrongAnswer({ type: 'fill_blank', userAnswer: 'story' })).toBe(false);
    expect(isBlankWrongAnswer({ type: 'translation', userAnswer: 'I. am.' })).toBe(false);
    expect(isBlankWrongAnswer({ type: 'vocab_spelling', userAnswer: 'a' })).toBe(false);
  });

  it('userAnswer 필드가 없는 유형(ordering/vocab_quiz/grammar_vocab)은 빈 답 취급 안 함', () => {
    expect(isBlankWrongAnswer({ type: 'ordering', userOrder: 'a → b', correctOrder: 'b → a' })).toBe(false);
    expect(isBlankWrongAnswer({ type: 'vocab_quiz', front_text: 'flash', back_text: '플래시' })).toBe(false);
    expect(isBlankWrongAnswer({ type: 'grammar_vocab', cpIdx: 1, itemIdx: 2, selectedOption: 'x' })).toBe(false);
    expect(isBlankWrongAnswer(null)).toBe(false);
    expect(isBlankWrongAnswer('x')).toBe(false);
  });

  it('배열 답은 전부 비었을 때만 빈 답', () => {
    expect(isBlankWrongAnswer({ userAnswer: ['', '.'] })).toBe(true);
    expect(isBlankWrongAnswer({ userAnswer: ['', 'dog'] })).toBe(false);
  });
});

describe('wrongAnswerKey', () => {
  it('같은 문항은 학생 답이 달라도 같은 키', () => {
    const a = { type: 'fill_blank', difficulty: 'easy', blankIndex: 3, correctAnswer: 'need', userAnswer: 'have' };
    const b = { ...a, userAnswer: 'want' };
    expect(wrongAnswerKey(a)).toBe(wrongAnswerKey(b));
  });

  it('유형별 식별 필드로 구분', () => {
    expect(wrongAnswerKey({ type: 'fill_blank', difficulty: 'easy', blankIndex: 3, correctAnswer: 'need' }))
      .not.toBe(wrongAnswerKey({ type: 'fill_blank', difficulty: 'hard', blankIndex: 3, correctAnswer: 'need' }));
    expect(wrongAnswerKey({ type: 'vocab_spelling', front_text: 'flash' }))
      .toBe(wrongAnswerKey({ type: 'vocab_quiz', front_text: 'flash' }));
    expect(wrongAnswerKey({ type: 'translation', koreanText: '고마워요.' }))
      .toBe(wrongAnswerKey({ type: 'first_letter', koreanText: '고마워요.' }));
    expect(wrongAnswerKey({ type: 'ordering', correctOrder: 'a → b' }))
      .not.toBe(wrongAnswerKey({ type: 'ordering', correctOrder: 'b → a' }));
  });

  it('알 수 없는 유형은 문항 텍스트, 없으면 전체 JSON', () => {
    expect(wrongAnswerKey({ question: 'Q1', userAnswer: 'x' })).toBe('t:Q1');
    expect(wrongAnswerKey({ foo: 1 })).toBe('raw:{"foo":1}');
  });
});

describe('cleanWrongAnswers', () => {
  it('빈 답을 제외하고 같은 문항은 마지막 것만 남긴다 (순서 유지)', () => {
    const items = [
      { type: 'fill_blank', difficulty: 'easy', blankIndex: 1, correctAnswer: 'a', userAnswer: 'x' },
      { type: 'fill_blank', difficulty: 'easy', blankIndex: 2, correctAnswer: 'b', userAnswer: '' },
      { type: 'fill_blank', difficulty: 'easy', blankIndex: 1, correctAnswer: 'a', userAnswer: 'y' },
      { type: 'fill_blank', difficulty: 'easy', blankIndex: 3, correctAnswer: 'c', userAnswer: 'z' },
    ];
    const out = cleanWrongAnswers(items);
    expect(out).toEqual([items[2], items[3]]);
  });

  it('전부 빈 답이면 빈 배열', () => {
    expect(cleanWrongAnswers([{ userAnswer: '.' }, { userAnswer: '' }])).toEqual([]);
  });

  it('pick으로 감싼 객체에서도 동작', () => {
    const rows = [
      { id: 1, question_data: { type: 'translation', koreanText: 'A', userAnswer: 'x' } },
      { id: 2, question_data: { type: 'translation', koreanText: 'A', userAnswer: 'y' } },
    ];
    expect(cleanWrongAnswers(rows, (r) => r.question_data).map((r) => r.id)).toEqual([2]);
  });
});
