import { describe, it, expect } from 'vitest';
import { validateProblemStructure, sanitizeQuestions, validateBeforeSave, validateAnswerKey, backfillSharedPassages, stripOptionSelfNumbering } from '@/lib/validation/problem-validator';
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

  describe('콤마 누락 복수정답 자동수정 (Rule 6)', () => {
    const opts5 = ['a', 'b', 'c', 'd', 'e'];

    it('"45" (선지 5개) → "4, 5"', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '두 개 고르면?', answer: '45', options: opts5 };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('4, 5');
    });

    it('"23" (선지 5개) → "2, 3"', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '두 개 고르면?', answer: '23', options: opts5 };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('2, 3');
    });

    it('범위 안 숫자 "12" + 선지 15개 → 그대로 (12번 선지 오인 방지)', () => {
      const opts15 = Array.from({ length: 15 }, (_, i) => `opt${i + 1}`);
      const q: NaesinProblemQuestion = { number: 1, question: 'Choose', answer: '12', options: opts15 };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('12');
    });

    it('자릿수에 0 포함 "10" (선지 5개) → 그대로 (0은 유효 선지 아님)', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'Choose', answer: '10', options: opts5 };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].answer).toBe('10');
    });

    it('단일 정답 "3"은 건드리지 않음', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'Choose', answer: '3', options: opts5 };
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

  describe('슬래시 복합 답안 자동 subParts 변환', () => {
    it('"A / B / C" → subParts 3개 자동 생성', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'Write the answers.',
        answer: 'was made / were built / is called',
      };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].subParts).toEqual([
        { label: '(1)', answer: 'was made' },
        { label: '(2)', answer: 'were built' },
        { label: '(3)', answer: 'is called' },
      ]);
    });

    it('"A / B" 2파트도 subParts 생성', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'Write the answers.',
        answer: 'had left / arrived',
      };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].subParts).toHaveLength(2);
      expect(questions[0].subParts![0].answer).toBe('had left');
      expect(questions[0].subParts![1].answer).toBe('arrived');
    });

    it('이미 subParts가 있으면 덮어쓰지 않음', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'Write the answers.',
        answer: 'A / B',
        subParts: [{ label: '①', answer: 'A' }, { label: '②', answer: 'B' }],
      };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].subParts![0].label).toBe('①'); // 기존 유지
    });

    it('객관식은 subParts 변환하지 않음', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'Choose',
        answer: '1 / 3',
        options: ['a', 'b', 'c', 'd', 'e'],
      };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].subParts).toBeUndefined();
    });

    it('슬래시 없는 서술형은 subParts 생성 안 함', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'Write the answer.',
        answer: 'The cat is on the mat.',
      };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].subParts).toBeUndefined();
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

  describe('PDF 추출 아티팩트 제거', () => {
    it('위첨자 번호 (¹⁾, ²⁵⁾) 제거', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: '¹⁾ 다음 문장을 해석하시오.\n²⁾ She is a teacher.',
        answer: 'She is a teacher.',
        explanation: '¹⁾ 해석: 그녀는 선생님이다.',
      };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].question).toBe('다음 문장을 해석하시오.\nShe is a teacher.');
      expect(questions[0].explanation).toBe('해석: 그녀는 선생님이다.');
    });

    it('U+FFFD 깨진 문자 제거', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'test',
        answer: '2',
        options: ['a', 'b', 'c', 'd', 'e'],
        explanation: '③은 틀\ufffd렸고 ⑤는 올바릅니다.',
      };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].explanation).toBe('③은 틀렸고 ⑤는 올바릅니다.');
    });

    it('선택지 내 위첨자/FFFD도 제거', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'test',
        answer: '1',
        options: ['¹⁾ run', 'ran\ufffd', 'running', 'runs', 'to run'],
      };
      const { questions } = sanitizeQuestions([q]);
      expect(questions[0].options![0]).toBe('run');
      expect(questions[0].options![1]).toBe('ran');
    });
  });

  describe('빈 정답 answer_key 복구', () => {
    it('answer가 비어있고 answerKey에 값이 있으면 복사', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: '빈칸에 들어갈 말을 고르시오.',
        answer: '',
        options: ['a', 'b', 'c', 'd', 'e'],
      };
      const { questions } = sanitizeQuestions([q], ['3']);
      expect(questions[0].answer).toBe('3');
    });

    it('answer가 이미 있으면 answerKey로 덮어쓰지 않음', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'test',
        answer: '2',
        options: ['a', 'b', 'c', 'd', 'e'],
      };
      const { questions } = sanitizeQuestions([q], ['3']);
      expect(questions[0].answer).toBe('2');
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

  describe('밑줄 유실 (UNDERLINE_MISSING)', () => {
    it('"밑줄 친 단어" 묻는데 <u> 없음 → 경고', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '다음 밑줄 친 단어와 바꾸어 쓸 수 있는 것은?\nIt was a surprising finding.', answer: '3', options: ['a', 'b', 'discovery', 'd', 'e'] };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'UNDERLINE_MISSING')).toBe(true);
    });
    it('<u>가 있으면 통과', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '다음 밑줄 친 단어는?\nIt was a surprising <u>finding</u>.', answer: '3', options: ['a', 'b', 'c', 'd', 'e'] };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'UNDERLINE_MISSING')).toBe(false);
    });
    it('지문에 ⓐ~ⓔ 마커가 있으면 면제(통과)', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '밑줄 친 ⓐ~ⓔ 중 어색한 것은?\nⓐwas ⓑdoing ...', answer: '3', options: ['ⓐ', 'ⓑ', 'ⓒ', 'ⓓ', 'ⓔ'] };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'UNDERLINE_MISSING')).toBe(false);
    });
    it('"밑줄" 언급 없으면 검사 안 함', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '다음 빈칸에 알맞은 것은?', answer: '3', options: ['a', 'b', 'c', 'd', 'e'] };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'UNDERLINE_MISSING')).toBe(false);
    });
  });

  describe('복수정답 누락 (MULTI_ANSWER_UNDERCOUNT)', () => {
    const opts = ['a', 'b', 'c', 'd', 'e'];
    it('명시 개수 "(정답 2개)"인데 1개만 저장 → 에러', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '알맞은 것을 모두 고르면? (정답 2개)', answer: '3', options: opts };
      const result = validateBeforeSave([q]);
      expect(result.warnings.some((e) => e.code === 'MULTI_ANSWER_UNDERCOUNT')).toBe(true);
    });
    it('"2개 고르시오"인데 1개만 → 에러', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '다음 중 어색한 것을 2개 고르시오.', answer: '4', options: opts };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'MULTI_ANSWER_UNDERCOUNT')).toBe(true);
    });
    it('명시 개수 충족 시 통과', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '알맞은 것을 모두 고르면? (정답 2개)', answer: '3, 5', options: opts };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'MULTI_ANSWER_UNDERCOUNT')).toBe(false);
    });
    it('"모두 고르면" + 정답 1개 + 해설이 선택지 2개 지목 → 에러', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '알맞지 않은 것을 모두 고르면?', answer: '3', options: opts, explanation: '③과 ⑤는 문맥에 맞지 않습니다.' };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'MULTI_ANSWER_UNDERCOUNT')).toBe(true);
    });
    it('"모두 고르면"이지만 해설이 1개만 지목 → 통과(단일정답 가능)', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '옳은 것을 모두 고르면?', answer: '3', options: opts, explanation: '③만 올바른 표현입니다.' };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'MULTI_ANSWER_UNDERCOUNT')).toBe(false);
    });
    it('"모두 고르면" + 해설이 5개 보기 다 설명(단일정답) → 통과(오탐 방지)', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '알맞지 않은 것을 모두 고르면?', answer: '3', options: opts, explanation: '③이 정답이다. ①②④⑤는 모두 본문과 일치한다.' };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'MULTI_ANSWER_UNDERCOUNT')).toBe(false);
    });
    it('조합형 보기("①,④" 등) "2개 고르면"은 단일정답이 옳음 → 통과(오탐 방지)', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '어법상 어색한 문장을 2개 고르면?', answer: '4',
        options: ['①, ④', '②, ③', '③, ⑤', '②, ④', '①, ②'], explanation: '② finish→finished, ④ went→gone' };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'MULTI_ANSWER_UNDERCOUNT')).toBe(false);
    });
    it('개별 보기(문장) "2개 고르면"인데 단일정답 → 에러(진짜 누락은 유지)', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '알맞지 않은 것을 모두 고르면?', answer: '3',
        options: ['It is fine.', 'She runs.', 'Do not touch it.', 'He can see.', 'You should not touch it.'], explanation: '③과 ⑤는 주의사항이라 부적절' };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'MULTI_ANSWER_UNDERCOUNT')).toBe(true);
    });
    it('복수정답 류 표현 없는 단일정답 문항은 통과', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '가장 알맞은 것은?', answer: '3', options: opts, explanation: '③이 정답이고 ①②④⑤는 오답입니다.' };
      expect(validateBeforeSave([q]).warnings.some((e) => e.code === 'MULTI_ANSWER_UNDERCOUNT')).toBe(false);
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

  describe('이미지 참조 문항 자동 삭제', () => {
    it('"다음 그림을 보고" 문항은 삭제됨', () => {
      const qs: NaesinProblemQuestion[] = [
        { number: 1, question: 'Choose the correct one.', answer: '2', options: ['a', 'b', 'c', 'd', 'e'] },
        { number: 2, question: '다음 그림을 보고 대화를 완성하시오.', answer: 'test' },
        { number: 3, question: 'Fill in the blank.', answer: 'word' },
      ];
      const { questions } = sanitizeQuestions(qs);
      expect(questions.length).toBe(2);
      expect(questions[0].question).toBe('Choose the correct one.');
      expect(questions[1].question).toBe('Fill in the blank.');
      expect(questions[1].number).toBe(2); // renumbered
    });

    it('인라인 설명 있는 그림 문항은 유지', () => {
      const qs: NaesinProblemQuestion[] = [
        { number: 1, question: '다음 그림을 보고 답하시오.\n(그림: 소녀가 자전거를 타고 있음)', answer: 'ride a bike' },
      ];
      const { questions } = sanitizeQuestions(qs);
      expect(questions.length).toBe(1);
    });

    it('"그림을 그리다" 등 내용 용법은 유지', () => {
      const qs: NaesinProblemQuestion[] = [
        { number: 1, question: '나는 그림을 잘 그린다를 영작하시오.', answer: 'I draw well' },
      ];
      const { questions } = sanitizeQuestions(qs);
      expect(questions.length).toBe(1);
    });

    it('지도·그래프·차트 의존 문항도 삭제됨', () => {
      const qs: NaesinProblemQuestion[] = [
        { number: 1, question: '다음 지도를 보고 길을 안내하시오.', answer: 'x' },
        { number: 2, question: '다음 그래프를 보고 물음에 답하시오.', answer: 'y' },
        { number: 3, question: '위 차트를 참고하여 빈칸을 채우시오.', answer: 'z' },
        { number: 4, question: 'Fill in the blank.', answer: 'word' },
      ];
      const { questions } = sanitizeQuestions(qs);
      expect(questions.length).toBe(1);
      expect(questions[0].question).toBe('Fill in the blank.');
    });

    it('표(table)를 보는 문항은 유지 (마크다운 표로 재현 가능)', () => {
      const qs: NaesinProblemQuestion[] = [
        { number: 1, question: '다음 표를 보고 물음에 답하시오.\n\n| 이름 | 나이 |\n| --- | --- |\n| Tom | 14 |', answer: 'Tom' },
      ];
      const { questions } = sanitizeQuestions(qs);
      expect(questions.length).toBe(1);
    });
  });

  describe('공통 지문 자동 복제 (backfillSharedPassages)', () => {
    const PASSAGE = 'Do you have any money worries? You may think you are a smart shopper, but hold on. There are various marketing strategies which influence your decisions every single day. Learning about them will help you become a smarter shopper who spends money wisely and saves more for the future, so let us look at three common examples together right now.';
    it('"위 글" 후속 문항에 앞 지문을 복사', () => {
      const qs: NaesinProblemQuestion[] = [
        { number: 1, question: `다음 글을 읽고 물음에 답하시오.\n\n${PASSAGE}`, answer: '1', options: ['a', 'b', 'c', 'd', 'e'] },
        { number: 2, question: '윗글의 요지로 알맞은 것은?', answer: '2', options: ['a', 'b', 'c', 'd', 'e'] },
        { number: 3, question: '위 글의 내용과 일치하는 것은?', answer: '3', options: ['a', 'b', 'c', 'd', 'e'] },
      ];
      const out = backfillSharedPassages(qs);
      expect(out[1].question).toContain('marketing strategies');
      expect(out[2].question).toContain('marketing strategies');
      // 후속 문항의 원래 stem도 보존
      expect(out[1].question).toContain('윗글의 요지');
    });

    it('이미 지문이 있는 문항은 건드리지 않음 (멱등)', () => {
      const qs: NaesinProblemQuestion[] = [
        { number: 1, question: `다음 글을 읽고 물음에 답하시오.\n\n${PASSAGE}`, answer: '1' },
        { number: 2, question: `${PASSAGE}\n\n윗글의 주제는?`, answer: '2' },
      ];
      const out = backfillSharedPassages(qs);
      expect(out[1].question).toBe(qs[1].question); // 변화 없음
    });

    it('앞에 지문 보유 문항이 없으면 그대로 둠', () => {
      const qs: NaesinProblemQuestion[] = [
        { number: 1, question: '위 대화의 내용과 일치하는 것은?', answer: '1', options: ['a', 'b', 'c', 'd', 'e'] },
      ];
      const out = backfillSharedPassages(qs);
      expect(out[0].question).toBe('위 대화의 내용과 일치하는 것은?');
    });

    it('지문 미참조 문항은 영향 없음', () => {
      const qs: NaesinProblemQuestion[] = [
        { number: 1, question: `다음 글을 읽고 물음에 답하시오.\n\n${PASSAGE}`, answer: '1' },
        { number: 2, question: '다음 중 어법상 어색한 것은?', answer: '2', options: ['a', 'b', 'c', 'd', 'e'] },
      ];
      const out = backfillSharedPassages(qs);
      expect(out[1].question).toBe('다음 중 어법상 어색한 것은?');
    });
  });

  describe('U+FFFD 경고', () => {
    it('깨진 문자가 포함되면 경고', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'test',
        answer: '2',
        options: ['a', 'b', 'c', 'd', 'e'],
        explanation: '틀\ufffd렸고',
      };
      const result = validateBeforeSave([q]);
      expect(result.warnings.some((w) => w.code === 'FFFD_CHAR')).toBe(true);
    });
  });

  describe('문제 텍스트 누락 (선지만 있고 문제 없음)', () => {
    it('선택지는 있는데 문제 텍스트가 비어있으면 에러', () => {
      const q: NaesinProblemQuestion = { number: 1, question: '', answer: '2', options: ['a', 'b', 'c', 'd', 'e'] };
      const result = validateBeforeSave([q]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_QUESTION_TEXT')).toBe(true);
    });

    it('문제 텍스트가 있으면 통과', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'Choose', answer: '2', options: ['a', 'b', 'c', 'd', 'e'] };
      const result = validateBeforeSave([q]);
      expect(result.errors.some((e) => e.code === 'MISSING_QUESTION_TEXT')).toBe(false);
    });
  });

  describe('정답 원형숫자 잔존', () => {
    it('정답에 ③이 남아있으면 에러', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'Choose', answer: '③', options: ['a', 'b', 'c', 'd', 'e'] };
      const result = validateBeforeSave([q]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'CIRCLED_NUMBER')).toBe(true);
    });

    it('숫자 정답은 통과', () => {
      const q: NaesinProblemQuestion = { number: 1, question: 'Choose', answer: '3', options: ['a', 'b', 'c', 'd', 'e'] };
      const result = validateBeforeSave([q]);
      expect(result.errors.some((e) => e.code === 'CIRCLED_NUMBER')).toBe(false);
    });
  });

  describe('리터럴 백슬래시n 깨짐', () => {
    it('선택지에 리터럴 백슬래시n이 있으면 경고', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'Choose',
        answer: '2',
        options: ['a', 'A:\\nB:', 'c', 'd', 'e'],
      };
      const result = validateBeforeSave([q]);
      expect(result.warnings.some((w) => w.code === 'LITERAL_BACKSLASH_N')).toBe(true);
    });

    it('실제 개행은 오탐하지 않음', () => {
      const q: NaesinProblemQuestion = {
        number: 1,
        question: 'A:\nB:',
        answer: '2',
        options: ['a', 'b', 'c', 'd', 'e'],
      };
      const result = validateBeforeSave([q]);
      expect(result.warnings.some((w) => w.code === 'LITERAL_BACKSLASH_N')).toBe(false);
    });
  });

});

describe('validateAnswerKey', () => {
  const qs = (n: number): NaesinProblemQuestion[] =>
    Array.from({ length: n }, (_, i) => ({ number: i + 1, question: `Q${i + 1}`, answer: '3', options: ['a', 'b', 'c', 'd', 'e'] }));

  it('answer_key가 문항보다 짧으면 PARTIAL_ANSWER_KEY 에러', () => {
    const issues = validateAnswerKey(qs(10), ['3', '3', '3', '3', '3']); // 10문항인데 5개
    expect(issues.some((i) => i.code === 'PARTIAL_ANSWER_KEY')).toBe(true);
    expect(issues[0].severity).toBe('error');
  });

  it('완전히 빈 answer_key([])는 폴백 처리 → 에러 아님', () => {
    expect(validateAnswerKey(qs(10), [])).toHaveLength(0);
  });

  it('answer_key 길이가 문항과 같으면 통과', () => {
    expect(validateAnswerKey(qs(5), ['1', '2', '3', '4', '5'])).toHaveLength(0);
  });

  it('answer_key가 더 길어도 PARTIAL 아님', () => {
    expect(validateAnswerKey(qs(3), ['1', '2', '3', '4', '5'])).toHaveLength(0);
  });

  it('answer_key가 배열이 아니면(null) 통과', () => {
    expect(validateAnswerKey(qs(5), null)).toHaveLength(0);
  });
});

describe('stripOptionSelfNumbering', () => {
  it('전 보기가 자기 번호(①~⑤)로 시작하면 접두사 제거', () => {
    expect(stripOptionSelfNumbering(['① fresh', '② tidy', '③ famous', '④ boring', '⑤ green']))
      .toEqual(['fresh', 'tidy', 'famous', 'boring', 'green']);
  });

  it('"1." / "1)" 스타일 접두사도 제거', () => {
    expect(stripOptionSelfNumbering(['1. go', '2. goes', '3. going', '4. gone', '5. went']))
      .toEqual(['go', 'goes', 'going', 'gone', 'went']);
    expect(stripOptionSelfNumbering(['1) a', '2) b', '3) c', '4) d', '5) e']))
      .toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('조합형 보기("①③")는 변형하지 않음 (인덱스 불일치)', () => {
    const combo = ['①, ③', '①, ④', '②, ③', '②, ⑤', '④, ⑤'];
    expect(stripOptionSelfNumbering(combo)).toEqual(combo);
  });

  it('접두사 제거 시 내용이 비면 발동하지 않음', () => {
    const bare = ['①', '②', '③', '④', '⑤'];
    expect(stripOptionSelfNumbering(bare)).toEqual(bare);
  });

  it('일부만 번호로 시작하면 발동하지 않음', () => {
    const mixed = ['① fresh', 'tidy', '③ famous', '④ boring', '⑤ green'];
    expect(stripOptionSelfNumbering(mixed)).toEqual(mixed);
  });
});

describe('sanitizeQuestions — 보기 자기번호 제거 (Rule 9)', () => {
  it('저장 시 "① fresh" 접두사가 제거된다', () => {
    const { questions } = sanitizeQuestions([
      { number: 1, question: 'Q', options: ['① fresh', '② tidy', '③ famous', '④ boring', '⑤ green'], answer: '2' },
    ] as NaesinProblemQuestion[]);
    expect(questions[0].options).toEqual(['fresh', 'tidy', 'famous', 'boring', 'green']);
  });
});
