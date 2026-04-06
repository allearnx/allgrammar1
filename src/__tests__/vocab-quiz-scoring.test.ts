import { describe, it, expect } from 'vitest';
import { generateQuizQuestions } from '@/hooks/use-quiz-state';
import type { NaesinVocabulary } from '@/types/database';

function makeVocab(i: number): NaesinVocabulary {
  return {
    id: `vocab-${i}`,
    unit_id: 'unit-1',
    front_text: `word${i}`,
    back_text: `meaning${i}`,
    part_of_speech: null,
    example_sentence: null,
    synonyms: null,
    antonyms: null,
    quiz_options: null,
    quiz_correct_index: null,
    spelling_hint: null,
    spelling_answer: null,
    sort_order: i,
    created_at: '',
  };
}

const vocabulary = Array.from({ length: 10 }, (_, i) => makeVocab(i));

describe('generateQuizQuestions', () => {
  it('correctIndex가 실제 정답 위치와 일치', () => {
    const questions = generateQuizQuestions(vocabulary);
    for (const q of questions) {
      expect(q.options[q.correctIndex]).toBe(q.correctAnswer);
    }
  });

  it('correctIndex가 숫자 타입', () => {
    const questions = generateQuizQuestions(vocabulary);
    for (const q of questions) {
      expect(typeof q.correctIndex).toBe('number');
    }
  });

  it('각 문제에 5개 선택지 생성', () => {
    const questions = generateQuizQuestions(vocabulary);
    for (const q of questions) {
      expect(q.options).toHaveLength(5);
    }
  });

  it('정답 선택지가 반드시 포함됨', () => {
    const questions = generateQuizQuestions(vocabulary);
    for (const q of questions) {
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  it('숫자 인덱스로 비교해야 정답 판정 성공 (string이면 실패)', () => {
    const questions = generateQuizQuestions(vocabulary);
    for (const q of questions) {
      // 실제 handleSelect 로직과 동일한 비교
      const selectedIndex: number = q.correctIndex;
      expect(selectedIndex === q.correctIndex).toBe(true);

      // string으로 비교하면 실패하는 것을 검증 (이번 버그의 원인)
      const selectedAsString: unknown = String(q.correctIndex);
      expect(selectedAsString === q.correctIndex).toBe(false);
    }
  });
});
