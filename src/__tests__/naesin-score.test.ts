import { describe, it, expect } from 'vitest';
import { computeSheetScore, hasPointWeights } from '@/lib/naesin/score';

describe('computeSheetScore — 배점 가중 vs 문항 수 기준', () => {
  const weighted = [{ points: 4 }, { points: 5 }, { points: 5 }, { points: 4 }]; // 총 18
  it('모든 문항에 배점이 있으면 배점 합으로 계산', () => {
    expect(hasPointWeights(weighted, 4)).toBe(true);
    expect(computeSheetScore(weighted, 4, [])).toBe(100);
    expect(computeSheetScore(weighted, 4, [2])).toBe(Math.round((13 / 18) * 100)); // 72
    expect(computeSheetScore(weighted, 4, [1, 4])).toBe(Math.round((10 / 18) * 100)); // 56
  });
  it('배점이 하나라도 없거나 문항 수가 안 맞으면 문항 수 기준', () => {
    expect(hasPointWeights([{ points: 4 }, {}], 2)).toBe(false);
    expect(computeSheetScore([{ points: 4 }, {}], 2, [1])).toBe(50);
    expect(computeSheetScore(weighted, 5, [1])).toBe(80);
    expect(computeSheetScore(undefined, 4, [1])).toBe(75);
  });
  it('배점이 0이나 음수면 가중 채점 안 함', () => {
    expect(hasPointWeights([{ points: 0 }, { points: 5 }], 2)).toBe(false);
  });
  it('문항 수 0이면 0점', () => {
    expect(computeSheetScore([], 0, [])).toBe(0);
  });
});
