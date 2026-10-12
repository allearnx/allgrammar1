import { describe, it, expect } from 'vitest';
import { chunkFixed, chunkPreservingGroups } from '@/lib/naesin/paraphrase-chunks';

describe('chunkFixed', () => {
  it('고정 크기로 자르고 마지막은 나머지', () => {
    expect(chunkFixed([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it('빈 배열은 빈 결과', () => {
    expect(chunkFixed([], 3)).toEqual([]);
  });
});

describe('chunkPreservingGroups', () => {
  it('같은 긴 지문(앞 100자 동일)을 공유하는 연속 문항은 경계에서 쪼개지 않는다', () => {
    const passage = 'P'.repeat(130);
    const qs = [
      { question: 'short one' }, { question: 'short two' },
      { question: passage + ' Q3' }, { question: passage + ' Q4' }, { question: passage + ' Q5' },
    ];
    const chunks = chunkPreservingGroups(qs, 3);
    expect(chunks.map((c) => c.length)).toEqual([5]);
  });
});
