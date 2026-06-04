import { describe, it, expect } from 'vitest';
import { validateProblemStructure, sanitizeQuestions, validateBeforeSave } from '@/lib/validation/problem-validator';
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

describe('sanitizeQuestions', () => {
  describe('원형숫자 변환', () => {
    it('①-⑤ 단일 원형숫자 → 숫자 변환', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'test', answer: '③', options: ['a', 'b', 'c', 'd', 'e'] };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('3');
    });

    it('⑦⑧⑨⑩ 확장 원형숫자 변환', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'test', answer: '⑧' };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('8');
    });

    it('연속 원형숫자 "①③" → "1, 3" 변환', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'test', answer: '①③', options: ['a', 'b', 'c', 'd', 'e'] };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('1, 3');
    });
  });

  describe('배열 정답 변환', () => {
    it('배열 ["2","4"] → "2, 4" 콤마구분 변환', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'test', answer: ['2', '4'] as unknown as string, options: ['a', 'b', 'c', 'd', 'e'] };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('2, 4');
    });

    it('배열 내 원형숫자도 변환', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'test', answer: ['①', '③'] as unknown as string, options: ['a', 'b', 'c', 'd', 'e'] };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('1, 3');
    });
  });

  describe('텍스트 정답 → 번호 변환', () => {
    it('객관식 텍스트 정답이 선택지와 일치하면 번호로 변환', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'Choose',
        answer: 'ran',
        options: ['run', 'ran', 'running', 'runs', 'to run'],
      };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('2');
    });

    it('"N번 텍스트" 패턴에서 번호 추출', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'Choose',
        answer: '3번 running',
        options: ['run', 'ran', 'running', 'runs', 'to run'],
      };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('3');
    });
  });

  describe('answer_key 동기화', () => {
    it('answer_key가 questions[].answer에서 재구축됨', () => {
      const questions: NaesinProblemQuestion[] = [
        { number: 1, question: 'Q1', answer: '③', options: ['a', 'b', 'c', 'd', 'e'] },
        { number: 2, question: 'Q2', answer: 'hello' },
      ];
      const { answerKey } = sanitizeQuestions(questions);
      expect(answerKey).toEqual(['3', 'hello']);
    });
  });

  describe('숫자형 정답 문자열 변환', () => {
    it('number 타입 정답 → string으로 변환', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'test', answer: 3, options: ['a', 'b', 'c', 'd', 'e'] };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('3');
      expect(typeof questions[0].answer).toBe('string');
    });
  });
});

describe('validateBeforeSave', () => {
  describe('빈 정답 차단', () => {
    it('문제 텍스트가 있고 정답이 비어있으면 에러', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'Choose the best answer.', answer: '' };
      const result = validateBeforeSave([q]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'EMPTY_ANSWER')).toBe(true);
    });

    it('문제와 정답 모두 있으면 통과', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'Choose', answer: '3', options: ['a', 'b', 'c', 'd', 'e'] };
      const result = validateBeforeSave([q]);
      expect(result.valid).toBe(true);
    });
  });

  describe('객관식 범위 검증', () => {
    it('정답이 선택지 범위를 벗어나면 에러', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'test', answer: '7', options: ['a', 'b', 'c', 'd', 'e'] };
      const result = validateBeforeSave([q]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MCQ_RANGE')).toBe(true);
    });

    it('정답 0은 범위 밖 에러', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'test', answer: '0', options: ['a', 'b', 'c', 'd', 'e'] };
      const result = validateBeforeSave([q]);
      expect(result.valid).toBe(false);
    });

    it('정답 1-5는 통과', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'test', answer: '3', options: ['a', 'b', 'c', 'd', 'e'] };
      const result = validateBeforeSave([q]);
      expect(result.valid).toBe(true);
    });
  });

  describe('복수정답 범위 검증', () => {
    it('"1, 3"은 5개 선택지에서 통과', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'test', answer: '1, 3', options: ['a', 'b', 'c', 'd', 'e'] };
      const result = validateBeforeSave([q]);
      expect(result.valid).toBe(true);
    });

    it('"1, 7"은 5개 선택지에서 에러', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'test', answer: '1, 7', options: ['a', 'b', 'c', 'd', 'e'] };
      const result = validateBeforeSave([q]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MCQ_RANGE')).toBe(true);
    });
  });

  describe('텍스트 정답 불일치', () => {
    it('선택지와 일치하지 않는 텍스트 정답 → 에러', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'Choose',
        answer: 'xyz',
        options: ['run', 'ran', 'running', 'runs', 'to run'],
      };
      const result = validateBeforeSave([q]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'TEXT_NOT_IN_OPTIONS')).toBe(true);
    });
  });

  describe('빈 시험지 허용', () => {
    it('문제가 없는 빈 배열은 허용 (PDF 모드)', () => {
      const result = validateBeforeSave([]);
      expect(result.valid).toBe(true);
    });
  });

  describe('서술형 경고', () => {
    it('해설 없으면 경고 (에러 아님)', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'Write a sentence.', answer: 'The cat sat.' };
      const result = validateBeforeSave([q]);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.code === 'NO_EXPLANATION')).toBe(true);
    });
  });
});
