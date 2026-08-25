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
