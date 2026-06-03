import { describe, it, expect } from 'vitest';
import { augmentPassageStages, DEFAULT_PASSAGE_STAGES } from '@/lib/naesin/adapters';
import type { NaesinPassage } from '@/types/database';

function makePassage(
  overrides: Partial<NaesinPassage> = {},
): Pick<NaesinPassage, 'grammar_vocab_items'> {
  return {
    grammar_vocab_items: null,
    ...overrides,
  };
}

const GRAMMAR_VOCAB_ITEMS = [
  {
    sentenceIndex: 0,
    original: 'He enjoyed eating meat.',
    korean: '그는 고기를 먹는 것을 즐겼다.',
    choicePoints: [
      { startWord: 1, endWord: 1, options: ['enjoyed', 'enjoys'], correctIndex: 0 },
    ],
  },
];

describe('augmentPassageStages', () => {
  // ── 기본값 ──

  it('requiredStages가 없으면 기본값을 반환한다', () => {
    const result = augmentPassageStages(undefined, []);
    expect(result).toEqual(DEFAULT_PASSAGE_STAGES);
  });

  it('requiredStages가 null이면 기본값을 반환한다', () => {
    const result = augmentPassageStages(null, []);
    expect(result).toEqual(DEFAULT_PASSAGE_STAGES);
  });

  it('기본값에 grammar_vocab가 포함되지 않음을 보장한다', () => {
    expect(DEFAULT_PASSAGE_STAGES).not.toContain('grammar_vocab');
  });

  // ── grammar_vocab 자동 추가 ──

  it('passage에 grammar_vocab_items가 있으면 grammar_vocab 탭을 자동 추가한다', () => {
    const passages = [makePassage({ grammar_vocab_items: GRAMMAR_VOCAB_ITEMS })];
    const result = augmentPassageStages(undefined, passages);
    expect(result).toContain('grammar_vocab');
  });

  it('여러 passage 중 하나라도 grammar_vocab_items가 있으면 추가한다', () => {
    const passages = [
      makePassage({ grammar_vocab_items: null }),
      makePassage({ grammar_vocab_items: GRAMMAR_VOCAB_ITEMS }),
    ];
    const result = augmentPassageStages(['fill_blanks', 'translation'], passages);
    expect(result).toContain('grammar_vocab');
  });

  it('grammar_vocab_items가 빈 배열이면 추가하지 않는다', () => {
    const passages = [makePassage({ grammar_vocab_items: [] })];
    const result = augmentPassageStages(undefined, passages);
    expect(result).not.toContain('grammar_vocab');
  });

  it('grammar_vocab_items가 null이면 추가하지 않는다', () => {
    const passages = [makePassage({ grammar_vocab_items: null })];
    const result = augmentPassageStages(undefined, passages);
    expect(result).not.toContain('grammar_vocab');
  });

  it('모든 passage가 데이터 없으면 추가하지 않는다', () => {
    const passages = [
      makePassage({ grammar_vocab_items: null }),
      makePassage({ grammar_vocab_items: [] }),
    ];
    const result = augmentPassageStages(undefined, passages);
    expect(result).not.toContain('grammar_vocab');
  });

  // ── 중복 방지 ──

  it('이미 grammar_vocab이 포함되어 있으면 중복 추가하지 않는다', () => {
    const passages = [makePassage({ grammar_vocab_items: GRAMMAR_VOCAB_ITEMS })];
    const result = augmentPassageStages(['fill_blanks', 'grammar_vocab', 'translation'], passages);
    const count = result.filter((s) => s === 'grammar_vocab').length;
    expect(count).toBe(1);
  });

  // ── 입력 불변성 ──

  it('원본 requiredStages 배열을 변경하지 않는다', () => {
    const original = ['fill_blanks', 'translation'];
    const frozen = [...original];
    augmentPassageStages(original, [makePassage({ grammar_vocab_items: GRAMMAR_VOCAB_ITEMS })]);
    expect(original).toEqual(frozen);
  });

  // ── 커스텀 설정 보존 ──

  it('커스텀 requiredStages 순서를 보존한다', () => {
    const passages = [makePassage({ grammar_vocab_items: GRAMMAR_VOCAB_ITEMS })];
    const result = augmentPassageStages(['translation', 'fill_blanks'], passages);
    expect(result[0]).toBe('translation');
    expect(result[1]).toBe('fill_blanks');
    expect(result[2]).toBe('grammar_vocab');
  });

  it('ordering 등 다른 스테이지가 포함된 설정도 그대로 유지한다', () => {
    const passages = [makePassage({ grammar_vocab_items: GRAMMAR_VOCAB_ITEMS })];
    const result = augmentPassageStages(['fill_blanks', 'ordering', 'translation'], passages);
    expect(result).toEqual(['fill_blanks', 'ordering', 'translation', 'grammar_vocab']);
  });

  // ── passages가 비어있을 때 ──

  it('passages가 빈 배열이면 기본값만 반환한다', () => {
    const result = augmentPassageStages(undefined, []);
    expect(result).toEqual(DEFAULT_PASSAGE_STAGES);
  });
});
