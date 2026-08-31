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
  it('같은 지시문 묶음에서 40% 유지 (5문항마다 1·3번째)', () => {
    const qs = Array.from({ length: 10 }, (_, i) => ({ number: i + 1, question: `${instr}\nSentence ${i} ___.`, answer: 'a' }));
    const kept = thinAlternate(qs);
    expect(kept.map((q) => q.number)).toEqual([1, 3, 6, 8]); // pos 0,2,5,7
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
    expect(kept.map((q) => q.number)).toEqual([1, 3]); // 40%: pos 0,2
  });

  it('그룹 판별 불가(지시문 없는 짧은 문항)는 삭제', () => {
    const qs = [
      { number: 1, question: 'Q1 ___.' },
      { number: 2, question: 'Q2 ___.' },
      { number: 3, question: 'Q3 ___.' },
    ];
    const kept = thinAlternate(qs as Record<string, unknown>[]);
    expect(kept).toEqual([]);
  });

  it('흩어져 있어도 같은 지시문(한국어 접두)이면 같은 그룹으로 교대', () => {
    const qs = [
      { number: 1, question: '다음 빈칸에 알맞은 말을 쓰시오. There ___ a dog.' },
      { number: 2, question: '다음 문장을 의문문으로 바꾸시오.\nThere is a cat.' },
      { number: 3, question: '다음 빈칸에 알맞은 말을 쓰시오. There ___ two cats.' },
      { number: 4, question: '다음 문장을 의문문으로 바꾸시오.\nThere are dogs.' },
      { number: 5, question: '다음 빈칸에 알맞은 말을 쓰시오. There ___ milk.' },
    ];
    const kept = thinAlternate(qs as Record<string, unknown>[]);
    expect(kept.map((q) => q.number)).toEqual([1, 2, 5]);
  });
});

describe('thinAlternate — 근접 창 (25문항)', () => {
  const instr = '다음 문장을 부정문으로 바꾸시오.';
  it('창 안(≤25)에서 재등장하면 같은 묶음으로 이어서 교대', () => {
    const other = Array.from({ length: 5 }, (_, i) => ({ number: 100 + i, question: `다음 빈칸에 알맞은 말을 쓰시오. There ___ item${i}.` }));
    const qs = [
      { number: 1, question: `${instr}\nA.` },
      { number: 2, question: `${instr}\nB.` },
      ...other,
      { number: 3, question: `${instr}\nC.` }, // 5칸 뒤 재등장 → 같은 묶음 3번째 → 유지
    ];
    const kept = thinAlternate(qs as Record<string, unknown>[]).map((q) => q.number);
    expect(kept).toContain(1);
    expect(kept).not.toContain(2);
    expect(kept).toContain(3);
  });

  it('창 밖(>25)에서 재등장하면 새 묶음으로 리셋 (첫 문항 유지)', () => {
    const filler = Array.from({ length: 30 }, (_, i) => ({ number: 200 + i, question: `다음 빈칸에 알맞은 말을 쓰시오. There ___ filler${i}.` }));
    const qs = [
      { number: 1, question: `${instr}\nA.` },
      { number: 2, question: `${instr}\nB.` },
      ...filler,
      { number: 3, question: `${instr}\nC.` }, // 30칸 뒤 → 새 묶음 1번째 → 유지
      { number: 4, question: `${instr}\nD.` }, // 새 묶음 2번째 → 삭제
    ];
    const kept = thinAlternate(qs as Record<string, unknown>[]).map((q) => q.number);
    expect(kept).toContain(1);
    expect(kept).not.toContain(2);
    expect(kept).toContain(3);
    expect(kept).not.toContain(4);
  });
});

describe('thinAlternate — 전체 상한 42%', () => {
  it('소그룹 왜곡으로 비율이 치솟으면 큰 그룹의 비보호 문항에서 덜어 42% 이하로', () => {
    // 큰 그룹 2개(각 10문항 → 4개 유지) + 2문항 소그룹 10개(각 1개 유지)
    // = 40문항 중 18개(45%) → 상한 17개(42%)로 축소돼야 함
    const qs: Record<string, unknown>[] = [];
    for (let g = 0; g < 2; g++) {
      for (let i = 0; i < 10; i++) {
        qs.push({ number: qs.length + 1, question: `다음 ${g}대형 유형의 문장을 완성하시오. Item ${i} ___.` });
      }
    }
    for (let g = 0; g < 10; g++) {
      qs.push({ number: qs.length + 1, question: `다음 ${g}소형 유형의 빈칸을 채우시오. A${g} ___.` });
      qs.push({ number: qs.length + 1, question: `다음 ${g}소형 유형의 빈칸을 채우시오. B${g} ___.` });
    }
    const kept = thinAlternate(qs);
    expect(kept.length).toBeLessThanOrEqual(Math.ceil(40 * 0.42));
    // 소그룹의 유일 대표(그룹 첫 문항)는 전부 보호됨
    for (let g = 0; g < 10; g++) {
      expect(kept.some((q) => String(q.question).includes(`${g}소형 유형`))).toBe(true);
    }
  });

  it('그룹 첫 문항만 남은 경우엔 상한보다 많아도 더 줄이지 않음', () => {
    // 싱글턴 그룹 10개 — 전부 pos 0이라 보호 대상
    const qs = Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      question: `다음 ${i}유형 문장을 완성하시오. Sentence number ${i} goes here.`,
    }));
    const kept = thinAlternate(qs as Record<string, unknown>[]);
    expect(kept).toHaveLength(10); // 유형이 전부 달라 하나도 못 줄임 (의도된 보호)
  });
});
