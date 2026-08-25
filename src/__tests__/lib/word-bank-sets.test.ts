import { describe, it, expect } from 'vitest';
import { bankWords, sameBank, rebuildBankSets } from '@/lib/naesin/word-bank-sets';

const bank = '[보기] fresh / clean / famous / boring / yellow';

describe('bankWords / sameBank', () => {
  it('[보기] 첫 줄에서 단어 추출', () => {
    expect(bankWords({ question: `${bank}\nQ1` })).toEqual(['fresh', 'clean', 'famous', 'boring', 'yellow']);
    expect(bankWords({ question: 'no bank here' })).toBeNull();
  });

  it('단어 집합이 같으면 순서 달라도 같은 세트', () => {
    const a = { question: `${bank}\nQ1` };
    const b = { question: '[보기] yellow / fresh / clean / famous / boring\nQ2' };
    expect(sameBank(a, b)).toBe(true);
    expect(sameBank(a, { question: '[보기] one / two\nQ' })).toBe(false);
  });
});

describe('rebuildBankSets', () => {
  it('세트의 변형된 정답들로 [보기]를 재조립해 전 문항에 동일 부착', () => {
    const orig = [
      { question: `${bank}\nSunny keeps her room ___.`, answer: 'clean' },
      { question: `${bank}\nWe keep our food ___.`, answer: 'fresh' },
      { question: `${bank}\nThe boy painted the table ___.`, answer: 'yellow' },
    ];
    // 변형본: 모델이 보기 상자를 제각각으로 만든 상황
    const out = [
      { question: '[보기] tidy / a / b\nTom keeps his desk ___.', answer: 'tidy' },
      { question: 'We should keep the milk ___.', answer: 'cold' },
      { question: '[보기] 다른것들\nShe painted the fence ___.', answer: 'green' },
    ];
    rebuildBankSets(orig, out);
    const expected = '[보기] cold / green / tidy';
    expect(String(out[0].question)).toBe(`${expected}\nTom keeps his desk ___.`);
    expect(String(out[1].question)).toBe(`${expected}\nWe should keep the milk ___.`);
    expect(String(out[2].question)).toBe(`${expected}\nShe painted the fence ___.`);
  });

  it('정답 중복 시 세트를 손대지 않음', () => {
    const orig = [
      { question: `${bank}\nQ1`, answer: 'clean' },
      { question: `${bank}\nQ2`, answer: 'fresh' },
    ];
    const out = [
      { question: 'A ___.', answer: 'tidy' },
      { question: 'B ___.', answer: 'tidy' },
    ];
    rebuildBankSets(orig, out);
    expect(out[0].question).toBe('A ___.');
  });

  it('원본·변형본 개수 불일치 시 건너뜀', () => {
    const orig = [{ question: `${bank}\nQ1`, answer: 'clean' }];
    const out: Record<string, unknown>[] = [];
    expect(() => rebuildBankSets(orig, out)).not.toThrow();
  });

  it('bank 없는 문항은 그대로', () => {
    const orig = [{ question: 'plain Q', answer: 'x' }];
    const out = [{ question: 'plain P', answer: 'y' }];
    rebuildBankSets(orig, out);
    expect(out[0].question).toBe('plain P');
  });
});
