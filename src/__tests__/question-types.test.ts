import { describe, it, expect } from 'vitest';
import { classifyQuestionType } from '@/lib/validation/question-types';
import type { NaesinProblemQuestion } from '@/types/naesin';

const opts5 = ['a', 'b', 'c', 'd', 'e'];
const q = (o: Partial<NaesinProblemQuestion>): Partial<NaesinProblemQuestion> => o;

describe('classifyQuestionType', () => {
  it('단일 객관식', () => {
    const r = classifyQuestionType(q({ question: 'Choose', options: opts5, answer: '3' }));
    expect(r.type).toBe('single_choice');
    expect(r.tag).toBe('단일');
  });

  it('인라인마커 — 보기가 ⓐ~ⓔ', () => {
    const r = classifyQuestionType(q({ question: '밑줄 친 것 중', options: ['ⓐ', 'ⓑ', 'ⓒ', 'ⓓ', 'ⓔ'], answer: '4' }));
    expect(r.type).toBe('single_choice');
    expect(r.choicesAreMarkers).toBe(true);
    expect(r.tag).toBe('인라인마커');
  });

  it('인라인마커 — 문제 텍스트로 감지', () => {
    const r = classifyQuestionType(q({ question: '밑줄 친 ⓐ~ⓔ 중 적절하지 않은 것은?', options: ['x', 'y', 'z', 'w', 'v'], answer: '5' }));
    expect(r.type).toBe('single_choice');
    expect(r.choicesAreMarkers).toBe(true);
  });

  it('복수정답 — 정답에 쉼표', () => {
    const r = classifyQuestionType(q({ question: 'Choose two', options: opts5, answer: '4, 5' }));
    expect(r.type).toBe('multi_choice');
  });

  it('복수정답 — 문제에 "모두 고르"', () => {
    const r = classifyQuestionType(q({ question: '어법상 옳은 것을 모두 고르시오', options: opts5, answer: '2' }));
    expect(r.type).toBe('multi_choice');
  });

  it('괄호선택 (who / which) → single_choice', () => {
    const r = classifyQuestionType(q({ question: 'The man (who / which) lives next door', answer: 'who' }));
    expect(r.type).toBe('single_choice');
    expect(r.tag).toBe('괄호선택');
    expect(r.needsOptionExtraction).toBe(true);
  });

  it('빈칸채우기(단어) → short_answer', () => {
    const r = classifyQuestionType(q({ question: '빈칸에 알맞은 말을 쓰시오. A: ___?', answer: 'whether' }));
    expect(r.type).toBe('short_answer');
    expect(r.tag).toBe('빈칸');
  });

  it('영작 → sentence', () => {
    const r = classifyQuestionType(q({ question: '다음을 영작하시오', answer: 'She is a doctor who lives in Seoul.' }));
    expect(r.type).toBe('sentence');
  });

  it('오류수정 → sentence', () => {
    const r = classifyQuestionType(q({ question: '어법상 어색한 부분을 고쳐 쓰시오', answer: 'My friends are funny.' }));
    expect(r.type).toBe('sentence');
    expect(r.tag).toBe('오류수정');
  });

  it('단어배열 → sentence', () => {
    const r = classifyQuestionType(q({ question: '주어진 단어를 배열하시오', answer: 'The house which has a red roof is ours.' }));
    expect(r.type).toBe('sentence');
    expect(r.tag).toBe('단어배열');
  });

  it('subParts → multi_part', () => {
    const r = classifyQuestionType(q({ question: '문장 완성', answer: 'a / b', subParts: [{ label: '(1)', answer: 'a' }, { label: '(2)', answer: 'b' }] }));
    expect(r.type).toBe('multi_part');
  });

  it('짧은 단어답 (빈칸 키워드 없음) → short_answer', () => {
    const r = classifyQuestionType(q({ question: 'Write the past tense of go', answer: 'went' }));
    expect(r.type).toBe('short_answer');
  });
});
