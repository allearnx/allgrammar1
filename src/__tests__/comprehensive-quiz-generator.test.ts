import { describe, it, expect } from 'vitest';
import { generateQuestions } from '@/components/voca/vocab-tab/comprehensive-quiz-generator';
import type { VocaVocabulary } from '@/types/voca';

function makeVocab(overrides: Partial<VocaVocabulary> & { front_text: string }): VocaVocabulary {
  return {
    id: overrides.front_text,
    day_id: 'day-1',
    front_text: overrides.front_text,
    back_text: overrides.back_text || '뜻',
    part_of_speech: null,
    example_sentence: null,
    synonyms: null,
    antonyms: null,
    spelling_hint: null,
    spelling_answer: null,
    idioms: null,
    sort_order: 0,
    created_at: '',
    ...overrides,
  };
}

describe('comprehensive-quiz-generator', () => {
  it('같은 단어가 여러 문제에 나오지 않음', () => {
    const vocab = Array.from({ length: 10 }, (_, i) => makeVocab({
      front_text: `word${i}`,
      back_text: `뜻${i}`,
      synonyms: `syn${i}a, syn${i}b`,
      antonyms: `ant${i}`,
      example_sentence: `I like word${i} very much.`,
      idioms: [{ en: `word${i} out`, ko: `숙어뜻${i}`, example_en: `Let's word${i} out.`, example_ko: `숙어해석${i}` }],
    }));

    const questions = generateQuestions(vocab);
    const wordCounts = new Map<string, number>();
    for (const q of questions) {
      wordCounts.set(q.word, (wordCounts.get(q.word) || 0) + 1);
    }

    for (const [word, count] of wordCounts) {
      expect(count, `"${word}" appeared ${count} times`).toBe(1);
    }
  });

  it('숙어가 여러 개인 단어도 문제 1개만 생성', () => {
    const vocab = [
      makeVocab({
        front_text: 'run',
        back_text: '달리다',
        idioms: [
          { en: 'run out', ko: '떨어지다', example_en: 'We ran out of milk.', example_ko: '우유가 떨어졌다.' },
          { en: 'run into', ko: '우연히 만나다', example_en: 'I ran into her.', example_ko: '그녀를 우연히 만났다.' },
          { en: 'run away', ko: '도망치다', example_en: 'He ran away.', example_ko: '그가 도망쳤다.' },
        ],
      }),
    ];

    const questions = generateQuestions(vocab);
    const idiomQuestions = questions.filter((q) => q.type.startsWith('idiom_'));
    expect(idiomQuestions.length).toBe(1);
  });

  it('숙어 문제 최대 4개', () => {
    const vocab = Array.from({ length: 10 }, (_, i) => makeVocab({
      front_text: `word${i}`,
      idioms: [{ en: `word${i} up`, ko: `뜻${i}` }],
    }));

    const questions = generateQuestions(vocab);
    const idiomQuestions = questions.filter((q) => q.type.startsWith('idiom_'));
    expect(idiomQuestions.length).toBeLessThanOrEqual(4);
  });

  it('객관식 유의어/반의어 각각 최대 3개', () => {
    const vocab = Array.from({ length: 10 }, (_, i) => makeVocab({
      front_text: `word${i}`,
      synonyms: `syn${i}a, syn${i}b`,
      antonyms: `ant${i}`,
    }));

    const questions = generateQuestions(vocab);
    const synQuestions = questions.filter((q) => q.type === 'mc_synonym');
    const antQuestions = questions.filter((q) => q.type === 'mc_antonym');
    expect(synQuestions.length).toBeLessThanOrEqual(3);
    expect(antQuestions.length).toBeLessThanOrEqual(3);
  });

  it('빈칸 문제 최대 2개', () => {
    const vocab = Array.from({ length: 10 }, (_, i) => makeVocab({
      front_text: `word${i}`,
      example_sentence: `I love word${i} today.`,
    }));

    const questions = generateQuestions(vocab);
    const fillQuestions = questions.filter((q) => q.type === 'fill_blank');
    expect(fillQuestions.length).toBeLessThanOrEqual(2);
  });

  it('데이터 없으면 빈 배열', () => {
    const vocab = [makeVocab({ front_text: 'hello', back_text: '안녕' })];
    const questions = generateQuestions(vocab);
    expect(questions).toHaveLength(0);
  });
});
