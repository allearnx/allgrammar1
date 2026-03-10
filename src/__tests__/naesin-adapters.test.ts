import { describe, it, expect } from 'vitest';
import { vocabToMemoryItem, passageToTextbookPassage } from '@/lib/naesin/adapters';
import type { NaesinVocabulary, NaesinPassage } from '@/types/database';

function makeVocab(overrides: Partial<NaesinVocabulary> = {}): NaesinVocabulary {
  return {
    id: 'vocab-1',
    unit_id: 'unit-1',
    front_text: 'apple',
    back_text: '사과',
    part_of_speech: 'noun',
    example_sentence: 'I eat an apple.',
    synonyms: null,
    antonyms: null,
    quiz_options: ['사과', '바나나', '오렌지', '포도'],
    quiz_correct_index: 0,
    spelling_hint: 'a__le',
    spelling_answer: 'apple',
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makePassage(overrides: Partial<NaesinPassage> = {}): NaesinPassage {
  return {
    id: 'passage-1',
    unit_id: 'unit-1',
    title: 'Test Passage',
    original_text: 'The cat sat on the mat.',
    korean_translation: '고양이가 매트 위에 앉았다.',
    blanks_easy: [{ index: 0, answer: 'cat' }],
    blanks_medium: null,
    blanks_hard: null,
    sentences: [
      { original: 'The cat sat.', korean: '고양이가 앉았다.', words: ['The', 'cat', 'sat.'] },
    ],
    grammar_vocab_items: null,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('vocabToMemoryItem', () => {
  it('maps required fields correctly', () => {
    const result = vocabToMemoryItem(makeVocab());
    expect(result.id).toBe('vocab-1');
    expect(result.front_text).toBe('apple');
    expect(result.back_text).toBe('사과');
    expect(result.quiz_options).toEqual(['사과', '바나나', '오렌지', '포도']);
    expect(result.quiz_correct_index).toBe(0);
    expect(result.spelling_hint).toBe('a__le');
    expect(result.spelling_answer).toBe('apple');
    expect(result.sort_order).toBe(1);
  });

  it('sets grammar_id to empty string', () => {
    expect(vocabToMemoryItem(makeVocab()).grammar_id).toBe('');
  });

  it('sets item_type to vocabulary', () => {
    expect(vocabToMemoryItem(makeVocab()).item_type).toBe('vocabulary');
  });

  it('sets progress to null', () => {
    expect(vocabToMemoryItem(makeVocab()).progress).toBeNull();
  });
});

describe('passageToTextbookPassage', () => {
  it('maps basic fields correctly', () => {
    const result = passageToTextbookPassage(makePassage());
    expect(result.id).toBe('passage-1');
    expect(result.title).toBe('Test Passage');
    expect(result.original_text).toBe('The cat sat on the mat.');
    expect(result.korean_translation).toBe('고양이가 매트 위에 앉았다.');
    expect(result.blanks_easy).toEqual([{ index: 0, answer: 'cat' }]);
  });

  it('preserves null sentences', () => {
    const result = passageToTextbookPassage(makePassage({ sentences: null }));
    expect(result.sentences).toBeNull();
  });

  it('sets is_textbook_mode_active to true', () => {
    expect(passageToTextbookPassage(makePassage()).is_textbook_mode_active).toBe(true);
  });

  it('sets grammar_id to empty string', () => {
    expect(passageToTextbookPassage(makePassage()).grammar_id).toBe('');
  });
});

describe('mergeParagraphNumbers (via passageToTextbookPassage)', () => {
  it('merges paragraph number into next sentence korean', () => {
    const result = passageToTextbookPassage(
      makePassage({
        sentences: [
          { original: '1.', korean: '', words: [] },
          { original: 'The cat sat.', korean: '고양이가 앉았다.', words: ['The', 'cat', 'sat.'] },
        ],
      })
    );
    expect(result.sentences).toHaveLength(1);
    expect(result.sentences![0].korean).toBe('1. 고양이가 앉았다.');
  });

  it('leaves normal sentences unchanged', () => {
    const sentences = [
      { original: 'Hello.', korean: '안녕.', words: ['Hello.'] },
      { original: 'World.', korean: '세계.', words: ['World.'] },
    ];
    const result = passageToTextbookPassage(makePassage({ sentences }));
    expect(result.sentences).toHaveLength(2);
    expect(result.sentences![0].korean).toBe('안녕.');
    expect(result.sentences![1].korean).toBe('세계.');
  });

  it('handles consecutive paragraph numbers', () => {
    const result = passageToTextbookPassage(
      makePassage({
        sentences: [
          { original: '1.', korean: '', words: [] },
          { original: '2.', korean: '', words: [] },
          { original: 'Hello.', korean: '안녕.', words: ['Hello.'] },
        ],
      })
    );
    // First "1." is pending, then "2." replaces it as the new pending number
    // "Hello." gets "2." prepended
    expect(result.sentences).toHaveLength(1);
    expect(result.sentences![0].korean).toBe('2. 안녕.');
  });
});
