import { describe, it, expect } from 'vitest';
import {
  generateMultiSelectQuestions,
  isExactMatch,
  type MultiSelectSource,
} from '@/lib/voca/multi-select-quiz';

// 교육부 초등 800의 실제 조합을 본뜬 픽스처 (형용사 주제 Day)
const DAY: MultiSelectSource[] = [
  { front_text: 'big', back_text: '큰' },
  { front_text: 'large', back_text: '큰, 넓은' },
  { front_text: 'tall', back_text: '(키가) 큰, 높은' },
  { front_text: 'great', back_text: '큰, 거대한' },
  { front_text: 'small', back_text: '작은' },
  { front_text: 'pretty', back_text: '예쁜' },
  { front_text: 'happy', back_text: '행복한' },
  { front_text: 'sad', back_text: '슬픈' },
  { front_text: 'cold', back_text: '추운' },
];

const findQ = (qs: ReturnType<typeof generateMultiSelectQuestions>, front: string) =>
  qs.find((q) => q.front_text === front);

describe('generateMultiSelectQuestions', () => {
  it('유의어 그룹: 프롬프트 토큰을 전부 포함하는 단어가 모두 정답이 된다', () => {
    const qs = generateMultiSelectQuestions(DAY);
    const q = findQ(qs, 'big')!; // prompt "큰"
    expect(q).toBeDefined();
    expect(new Set(q.answers)).toEqual(new Set(['big', 'large', 'tall', 'great']));
  });

  it('상위집합이 아닌 부분 겹침 단어는 정답도 보기도 아니다 (중간지대 제외)', () => {
    const qs = generateMultiSelectQuestions(DAY);
    // prompt "큰, 넓은" — big의 "큰" 문제와 토큰 집합이 달라 dedup되지 않고 항상 출제된다
    const q = findQ(qs, 'large')!;
    expect(q).toBeDefined();
    expect(q.answers).toEqual(['large']);
    // big·tall·great는 "큰"만 겹침 → 정답 아님 + 보기에서도 제외
    for (const w of ['big', 'tall', 'great']) {
      expect(q.options).not.toContain(w);
    }
  });

  it('정답은 항상 options의 부분집합이다', () => {
    const qs = generateMultiSelectQuestions(DAY);
    for (const q of qs) {
      for (const a of q.answers) expect(q.options).toContain(a);
    }
  });

  it('오답 보기는 프롬프트와 뜻이 전혀 겹치지 않는 단어만 쓴다', () => {
    const qs = generateMultiSelectQuestions(DAY);
    const q = findQ(qs, 'big')!;
    const distractors = q.options.filter((o) => !q.answers.includes(o));
    // 형용사 Day에서 "큰"과 안 겹치는 것: small, pretty, happy, sad, cold
    for (const d of distractors) {
      expect(['small', 'pretty', 'happy', 'sad', 'cold']).toContain(d);
    }
    expect(distractors.length).toBeGreaterThanOrEqual(2);
  });

  it('뜻이 완전히 같은 단어(ship·boat="배")는 문제 하나로 합쳐진다', () => {
    const day = [
      { front_text: 'ship', back_text: '배' },
      { front_text: 'boat', back_text: '배' },
      { front_text: 'car', back_text: '자동차' },
      { front_text: 'train', back_text: '기차' },
      { front_text: 'bike', back_text: '자전거' },
    ];
    const qs = generateMultiSelectQuestions(day);
    const shipQs = qs.filter((q) => q.prompt === '배');
    expect(shipQs.length).toBe(1);
    expect(new Set(shipQs[0].answers)).toEqual(new Set(['ship', 'boat']));
  });

  it('안전한 오답 보기가 2개 미만이면 그 단어는 출제하지 않는다', () => {
    // big의 유의어 4개 + 오답 후보 1개뿐 → 출제 불가
    const day = [
      { front_text: 'big', back_text: '큰' },
      { front_text: 'large', back_text: '큰, 넓은' },
      { front_text: 'tall', back_text: '(키가) 큰, 높은' },
      { front_text: 'great', back_text: '큰, 거대한' },
      { front_text: 'small', back_text: '작은' },
    ];
    const qs = generateMultiSelectQuestions(day);
    expect(findQ(qs, 'big')).toBeUndefined();
  });

  it('뜻이 빈 단어는 건너뛴다', () => {
    const day = [
      { front_text: 'ghost', back_text: '' },
      ...DAY,
    ];
    const qs = generateMultiSelectQuestions(day);
    expect(findQ(qs, 'ghost')).toBeUndefined();
  });

  it('단답 문제: 유의어가 없으면 정답이 자기 자신 하나다', () => {
    const qs = generateMultiSelectQuestions(DAY);
    const q = findQ(qs, 'happy')!;
    expect(q.answers).toEqual(['happy']);
    expect(q.options.length).toBeGreaterThanOrEqual(5); // 정답 1 + 오답 4
  });
});

describe('isExactMatch', () => {
  it('정답 집합과 완전히 일치해야 정답', () => {
    expect(isExactMatch(new Set(['big', 'large']), ['large', 'big'])).toBe(true);
  });

  it('하나라도 빠뜨리면 오답 (부분 선택 불인정)', () => {
    expect(isExactMatch(new Set(['big']), ['big', 'large'])).toBe(false);
  });

  it('오답을 하나라도 섞으면 오답', () => {
    expect(isExactMatch(new Set(['big', 'small']), ['big'])).toBe(false);
    expect(isExactMatch(new Set(['big', 'large', 'small']), ['big', 'large'])).toBe(false);
  });

  it('빈 선택은 오답', () => {
    expect(isExactMatch(new Set(), ['big'])).toBe(false);
  });
});
