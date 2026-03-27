import { describe, it, expect } from 'vitest';
import { validateProblemStructure } from '@/lib/validation/problem-validator';
import type { NaesinProblemQuestion } from '@/types/naesin';

function makeMcq(n: number, answer: number = (n % 5) + 1): NaesinProblemQuestion {
  return {
    number: n,
    question: `Question ${n}: Choose the correct answer.`,
    options: ['① opt1', '② opt2', '③ opt3', '④ opt4', '⑤ opt5'],
    answer,
    explanation: `Explanation for question ${n}`,
  };
}

function makeSubjective(n: number): NaesinProblemQuestion {
  return {
    number: n,
    question: `Question ${n}: Write the correct sentence.`,
    answer: 'The cat is on the mat.',
    explanation: `Explanation for question ${n}`,
  };
}

describe('validateProblemStructure', () => {
  describe('valid sets', () => {
    it('passes a valid 50-question set (32 MCQ + 18 subjective)', () => {
      const questions = [
        ...Array.from({ length: 32 }, (_, i) => makeMcq(i + 1)),
        ...Array.from({ length: 18 }, (_, i) => makeSubjective(i + 33)),
      ];
      const result = validateProblemStructure(questions, 32, 18);
      expect(result.valid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('passes a small valid set', () => {
      const questions = [makeMcq(1), makeMcq(2), makeSubjective(3)];
      const result = validateProblemStructure(questions);
      expect(result.valid).toBe(true);
      expect(result.errorCount).toBe(0);
    });
  });

  describe('empty/null input', () => {
    it('fails on empty array', () => {
      const result = validateProblemStructure([]);
      expect(result.valid).toBe(false);
      expect(result.errorCount).toBe(1);
      expect(result.issues[0].code).toBe('EMPTY_SET');
    });
  });

  describe('required field validation', () => {
    it('detects missing question text', () => {
      const q = makeMcq(1);
      q.question = '';
      const result = validateProblemStructure([q]);
      expect(result.issues.some((i) => i.code === 'MISSING_QUESTION')).toBe(true);
    });

    it('detects missing answer', () => {
      const q = makeMcq(1);
      q.answer = '';
      const result = validateProblemStructure([q]);
      expect(result.issues.some((i) => i.code === 'MISSING_ANSWER')).toBe(true);
    });
  });

  describe('MCQ validation', () => {
    it('detects wrong option count', () => {
      const q = makeMcq(1);
      q.options = ['① a', '② b', '③ c']; // only 3
      const result = validateProblemStructure([q]);
      expect(result.issues.some((i) => i.code === 'WRONG_OPTION_COUNT')).toBe(true);
    });

    it('detects empty options', () => {
      const q = makeMcq(1);
      q.options = ['① a', '', '③ c', '④ d', '⑤ e'];
      const result = validateProblemStructure([q]);
      expect(result.issues.some((i) => i.code === 'EMPTY_OPTION')).toBe(true);
    });

    it('warns when answer not in options', () => {
      const q = makeMcq(1);
      q.answer = 'something not matching';
      const result = validateProblemStructure([q]);
      expect(result.issues.some((i) => i.code === 'ANSWER_NOT_IN_OPTIONS')).toBe(true);
    });
  });

  describe('subjective validation', () => {
    it('warns on numeric answer for subjective', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'Write a sentence.',
        answer: 3,
        explanation: 'test',
      };
      const result = validateProblemStructure([q]);
      expect(result.issues.some((i) => i.code === 'SUBJECTIVE_NUMERIC_ANSWER')).toBe(true);
    });
  });

  describe('duplicate detection', () => {
    it('detects duplicate numbers', () => {
      const questions = [makeMcq(1), makeMcq(1)];
      const result = validateProblemStructure(questions);
      expect(result.issues.some((i) => i.code === 'DUPLICATE_NUMBER')).toBe(true);
    });

    it('detects duplicate question text', () => {
      const q1 = makeMcq(1);
      const q2 = makeMcq(2);
      q2.question = q1.question; // same text
      const result = validateProblemStructure([q1, q2]);
      expect(result.issues.some((i) => i.code === 'DUPLICATE_TEXT')).toBe(true);
    });
  });

  describe('number sequence', () => {
    it('warns on number gaps', () => {
      const questions = [makeMcq(1), makeMcq(3)]; // missing 2
      const result = validateProblemStructure(questions);
      expect(result.issues.some((i) => i.code === 'NUMBER_GAP')).toBe(true);
    });
  });

  describe('answer distribution bias', () => {
    it('warns when a specific answer number is overrepresented', () => {
      // 12 questions, all answer = 1 → 100% bias
      const questions = Array.from({ length: 12 }, (_, i) => makeMcq(i + 1, 1));
      const result = validateProblemStructure(questions);
      expect(result.issues.some((i) => i.code === 'ANSWER_BIAS')).toBe(true);
    });

    it('does not warn on balanced distribution', () => {
      // 10 questions, answers cycling 1-5
      const questions = Array.from({ length: 10 }, (_, i) => makeMcq(i + 1, (i % 5) + 1));
      const result = validateProblemStructure(questions);
      expect(result.issues.some((i) => i.code === 'ANSWER_BIAS')).toBe(false);
    });
  });

  describe('explanation warnings', () => {
    it('warns on missing explanation', () => {
      const q = makeMcq(1);
      delete (q as unknown as Record<string, unknown>).explanation;
      const result = validateProblemStructure([q]);
      expect(result.issues.some((i) => i.code === 'NO_EXPLANATION')).toBe(true);
    });
  });

  describe('expected count mismatches', () => {
    it('warns when MCQ count differs from expected', () => {
      const questions = [makeMcq(1), makeMcq(2)];
      const result = validateProblemStructure(questions, 5);
      expect(result.issues.some((i) => i.code === 'MCQ_COUNT_MISMATCH')).toBe(true);
    });

    it('warns when subjective count differs from expected', () => {
      const questions = [makeSubjective(1)];
      const result = validateProblemStructure(questions, undefined, 3);
      expect(result.issues.some((i) => i.code === 'SUBJECTIVE_COUNT_MISMATCH')).toBe(true);
    });
  });
});
