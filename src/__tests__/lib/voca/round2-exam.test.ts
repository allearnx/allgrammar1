import { describe, it, expect } from 'vitest';
import {
  parseRelated,
  isRelatedCorrect,
  buildCandidates,
  buildRound2ExamQuestions,
  type Round2Vocab,
} from '@/lib/voca/round2-exam';

const VOCAB: Round2Vocab[] = [
  { id: 'a', front_text: 'fair', back_text: '공정한', synonyms: 'just, equal', antonyms: 'unfair' },
  { id: 'b', front_text: 'include', back_text: '포함하다', synonyms: 'contain, involve', antonyms: 'exclude' },
  { id: 'c', front_text: 'attempt', back_text: '시도', synonyms: 'try, effort', antonyms: null },
  { id: 'd', front_text: 'plain', back_text: '평범한', synonyms: null, antonyms: null },
];

const noShuffle = <T>(a: T[]): T[] => a;

describe('parseRelated', () => {
  it('쉼표로 분리하고 공백 정리', () => {
    expect(parseRelated('just, equal')).toEqual(['just', 'equal']);
    expect(parseRelated('leave out, omit')).toEqual(['leave out', 'omit']);
    expect(parseRelated(null)).toEqual([]);
    expect(parseRelated('')).toEqual([]);
  });
});

describe('isRelatedCorrect', () => {
  it('정답 후보 중 하나만 맞아도 정답 (대소문자·공백 무시)', () => {
    expect(isRelatedCorrect('Just', ['just', 'equal'])).toBe(true);
    expect(isRelatedCorrect(' equal ', ['just', 'equal'])).toBe(true);
    expect(isRelatedCorrect('leave  out', ['leave out', 'omit'])).toBe(true);
    expect(isRelatedCorrect('wrong', ['just', 'equal'])).toBe(false);
    expect(isRelatedCorrect('', ['just'])).toBe(false);
  });
});

describe('buildCandidates', () => {
  it('유의어·반의어 데이터 있는 것만 후보로', () => {
    const c = buildCandidates(VOCAB);
    // fair: syn+ant(2), include: syn+ant(2), attempt: syn(1), plain: 0 → 5
    expect(c.length).toBe(5);
    expect(c.filter((x) => x.relation === 'synonym').length).toBe(3);
    expect(c.filter((x) => x.relation === 'antonym').length).toBe(2);
  });
});

describe('buildRound2ExamQuestions', () => {
  it('totalCount만큼 생성, 후보 부족하면 있는 만큼', () => {
    expect(buildRound2ExamQuestions(VOCAB, { totalCount: 3, shuffle: noShuffle }).length).toBe(3);
    expect(buildRound2ExamQuestions(VOCAB, { totalCount: 99, shuffle: noShuffle }).length).toBe(5);
  });

  it('choiceRatio로 4지선다/스펠링 비율 분배', () => {
    const qs = buildRound2ExamQuestions(VOCAB, { totalCount: 4, choiceRatio: 0.5, shuffle: noShuffle });
    expect(qs.filter((q) => q.format === 'choice').length).toBe(2);
    expect(qs.filter((q) => q.format === 'spelling').length).toBe(2);
  });

  it('4지선다는 보기 4개(정답 포함), 오답은 정답과 안 겹침', () => {
    const qs = buildRound2ExamQuestions(VOCAB, { totalCount: 5, choiceRatio: 1, shuffle: noShuffle });
    for (const q of qs) {
      expect(q.options).toHaveLength(4);
      expect(q.options!.some((o) => q.answers.includes(o))).toBe(true);
    }
  });

  it('스펠링 문항엔 options 없음', () => {
    const qs = buildRound2ExamQuestions(VOCAB, { totalCount: 5, choiceRatio: 0, shuffle: noShuffle });
    expect(qs.every((q) => q.format === 'spelling' && q.options === undefined)).toBe(true);
  });
});
