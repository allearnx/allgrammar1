import { describe, it, expect } from 'vitest';
import { splitQuestionsIntoSets, type GeneratedQuestion } from '@/components/dashboard/naesin-admin/content-dialogs/shared/question-utils';

function q(question: string, n = 1): GeneratedQuestion {
  return { number: n, question, options: null, answer: 'a', explanation: '' };
}

describe('splitQuestionsIntoSets', () => {
  it('30문제 이하는 분할하지 않음', () => {
    const qs = Array.from({ length: 30 }, (_, i) => q(`Q${i}`, i + 1));
    expect(splitQuestionsIntoSets(qs)).toHaveLength(1);
  });

  it('대량 문제는 30문제 안팎 세트로 분할', () => {
    const qs = Array.from({ length: 95 }, (_, i) => q(`Q${i}`, i + 1));
    const sets = splitQuestionsIntoSets(qs);
    expect(sets).toHaveLength(4); // 30+30+30+5
    expect(sets.flat()).toHaveLength(95);
    expect(sets[0]).toHaveLength(30);
    expect(sets[3]).toHaveLength(5);
  });

  it('word bank 세트([보기] 첫 줄 동일)는 경계에서 안 쪼갬', () => {
    const bank = '[보기] fresh / clean / famous / boring / yellow';
    const qs = [
      ...Array.from({ length: 28 }, (_, i) => q(`Q${i}`, i + 1)),
      ...Array.from({ length: 5 }, (_, i) => q(`${bank}\nSentence ${i} ______.`, 29 + i)),
      ...Array.from({ length: 10 }, (_, i) => q(`Tail${i}`, 34 + i)),
    ];
    const sets = splitQuestionsIntoSets(qs);
    // 첫 세트가 30에서 끝나면 bank 세트(29~33)가 쪼개지므로 33까지 확장돼야 함
    expect(sets[0]).toHaveLength(33);
    expect(sets[0].slice(28).every((x) => x.question.startsWith(bank))).toBe(true);
    expect(sets.flat()).toHaveLength(43);
  });

  it('공통 지문(긴 공통 접두사) 그룹도 안 쪼갬', () => {
    const passage = 'A'.repeat(150);
    const qs = [
      ...Array.from({ length: 29 }, (_, i) => q(`Q${i}`, i + 1)),
      q(`${passage} 질문 하나`, 30),
      q(`${passage} 질문 둘`, 31),
      q('Tail', 32),
    ];
    const sets = splitQuestionsIntoSets(qs);
    expect(sets[0]).toHaveLength(31); // 지문 쌍(30,31)이 함께 첫 세트에
    expect(sets[1]).toHaveLength(1);
  });
});

import { thinAlternate } from '@/lib/naesin/paraphrase-chunks';

describe('thinAlternate — 절반 추출', () => {
  const instr = '다음 빈칸에 알맞은 비교급을 쓰시오.';
  it('같은 지시문 묶음에서 1·3·5번째만 유지', () => {
    const qs = Array.from({ length: 6 }, (_, i) => ({ number: i + 1, question: `${instr}\nSentence ${i} ___.`, answer: 'a' }));
    const kept = thinAlternate(qs);
    expect(kept.map((q) => q.number)).toEqual([1, 3, 5]);
  });

  it('그룹이 바뀌면 교대가 리셋 — 모든 묶음이 최소 1문항 유지', () => {
    const qs = [
      { number: 1, question: `${instr}\nA ___.` },
      { number: 2, question: `${instr}\nB ___.` },
      { number: 3, question: '다음 문장을 의문문으로 바꾸시오.\nThere is a dog.' },
      { number: 4, question: '다음 문장을 의문문으로 바꾸시오.\nThere are cats.' },
      { number: 5, question: '단독 지시문 문항입니다. 최상급을 쓰시오.' },
    ];
    const kept = thinAlternate(qs as Record<string, unknown>[]);
    expect(kept.map((q) => q.number)).toEqual([1, 3, 5]);
  });

  it('word bank 세트도 교대 유지 (동일 [보기] 줄 공유)', () => {
    const bank = '[보기] fresh / clean / famous / boring / yellow';
    const qs = Array.from({ length: 5 }, (_, i) => ({ number: i + 1, question: `${bank}\nSentence ${i} ___.` }));
    const kept = thinAlternate(qs as Record<string, unknown>[]);
    expect(kept.map((q) => q.number)).toEqual([1, 3, 5]);
  });

  it('짧은 지시문(8자 미만 첫 줄)은 그룹으로 안 묶여 각자 유지', () => {
    const qs = [
      { number: 1, question: 'Q1 ___.' },
      { number: 2, question: 'Q2 ___.' },
      { number: 3, question: 'Q3 ___.' },
    ];
    const kept = thinAlternate(qs as Record<string, unknown>[]);
    expect(kept.map((q) => q.number)).toEqual([1, 2, 3]);
  });
});
