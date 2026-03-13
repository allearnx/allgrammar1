import type { VocaVocabulary } from '@/types/voca';

// ── Question Types ──

export type QuestionType =
  | 'mc_synonym'       // 1. 5지선다 유의어
  | 'mc_antonym'       // 2. 5지선다 반의어
  | 'short_synonym'    // 3. 단답형 유의어
  | 'short_antonym'    // 4. 단답형 반의어
  | 'fill_blank'       // 5. 문장 빈칸
  | 'idiom_en_to_ko'   // 6. 숙어 영→한
  | 'idiom_ko_to_en'   // 7. 숙어 한→영
  | 'idiom_example_translate' // 8. 숙어 예문 해석
  | 'idiom_writing';   // 9. 숙어 영작

export interface BaseQuestion {
  type: QuestionType;
  word: string;
  prompt: string;
  reference: string;
}

export interface MCQuestion extends BaseQuestion {
  type: 'mc_synonym' | 'mc_antonym';
  choices: string[];
  correctIndex: number;
}

export interface ShortQuestion extends BaseQuestion {
  type: 'short_synonym' | 'short_antonym' | 'fill_blank';
  acceptedAnswers: string[];
}

export interface AIQuestion extends BaseQuestion {
  type: 'idiom_en_to_ko' | 'idiom_ko_to_en' | 'idiom_example_translate' | 'idiom_writing';
}

export type Question = MCQuestion | ShortQuestion | AIQuestion;

export interface QuestionResult {
  question: Question;
  studentAnswer: string;
  score: number;
  feedback: string;
}

// ── Helpers ──

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Question Generation ──

export function generateQuestions(vocabulary: VocaVocabulary[]): Question[] {
  const questions: Question[] = [];

  const withSynonyms = shuffle(vocabulary.filter((v) => v.synonyms));
  const withAntonyms = shuffle(vocabulary.filter((v) => v.antonyms));
  const withExample = shuffle(vocabulary.filter((v) => v.example_sentence));
  const withIdioms = vocabulary.filter((v) => v.idioms && v.idioms.length > 0);

  // All synonym/antonym values for distractor generation
  const allSynonyms = withSynonyms.map((v) => v.synonyms!.split(',')[0].trim()).filter(Boolean);
  const allAntonyms = withAntonyms.map((v) => v.antonyms!.split(',')[0].trim()).filter(Boolean);

  // Track used words to avoid same word appearing in multiple question types
  const usedSynWords = new Set<string>();
  const usedAntWords = new Set<string>();

  // 1. MC synonym (if >= 4 synonyms for distractors)
  if (withSynonyms.length >= 1 && allSynonyms.length >= 4) {
    for (const v of withSynonyms.slice(0, 3)) {
      const correct = v.synonyms!.split(',')[0].trim();
      const distractors = shuffle(allSynonyms.filter((s) => s !== correct)).slice(0, 4);
      if (distractors.length < 4) continue;
      const choices = shuffle([correct, ...distractors]);
      usedSynWords.add(v.front_text);
      questions.push({
        type: 'mc_synonym',
        word: v.front_text,
        prompt: `"${v.front_text}"의 유의어를 고르세요.`,
        reference: correct,
        choices,
        correctIndex: choices.indexOf(correct),
      });
    }
  }

  // 2. MC antonym
  if (withAntonyms.length >= 1 && allAntonyms.length >= 4) {
    for (const v of withAntonyms.slice(0, 3)) {
      const correct = v.antonyms!.split(',')[0].trim();
      const distractors = shuffle(allAntonyms.filter((s) => s !== correct)).slice(0, 4);
      if (distractors.length < 4) continue;
      const choices = shuffle([correct, ...distractors]);
      usedAntWords.add(v.front_text);
      questions.push({
        type: 'mc_antonym',
        word: v.front_text,
        prompt: `"${v.front_text}"의 반의어를 고르세요.`,
        reference: correct,
        choices,
        correctIndex: choices.indexOf(correct),
      });
    }
  }

  // 3. Short answer synonym — skip words already used in MC synonym
  for (const v of withSynonyms.filter((v) => !usedSynWords.has(v.front_text)).slice(0, 2)) {
    const accepted = v.synonyms!.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    questions.push({
      type: 'short_synonym',
      word: v.front_text,
      prompt: `"${v.front_text}"의 유의어를 쓰세요.`,
      reference: v.synonyms!,
      acceptedAnswers: accepted,
    });
  }

  // 4. Short answer antonym — skip words already used in MC antonym
  for (const v of withAntonyms.filter((v) => !usedAntWords.has(v.front_text)).slice(0, 2)) {
    const accepted = v.antonyms!.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    questions.push({
      type: 'short_antonym',
      word: v.front_text,
      prompt: `"${v.front_text}"의 반의어를 쓰세요.`,
      reference: v.antonyms!,
      acceptedAnswers: accepted,
    });
  }

  // 5. Fill blank — show Korean meaning as hint
  for (const v of withExample.slice(0, 3)) {
    const sentence = v.example_sentence!;
    const word = v.front_text.toLowerCase();
    // Create blank version
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (!regex.test(sentence)) continue;
    const blanked = sentence.replace(regex, '________');
    questions.push({
      type: 'fill_blank',
      word: v.front_text,
      prompt: `다음 빈칸에 알맞은 단어를 쓰세요.\n\n${blanked}\n\n💡 뜻: ${v.back_text}`,
      reference: v.front_text,
      acceptedAnswers: [word],
    });
  }

  // Idiom questions
  for (const v of withIdioms) {
    const idioms = v.idioms!;
    for (const idiom of idioms) {
      // 6. Idiom en→ko
      questions.push({
        type: 'idiom_en_to_ko',
        word: v.front_text,
        prompt: `다음 숙어의 뜻을 한국어로 쓰세요.\n"${idiom.en}"`,
        reference: idiom.ko,
      });

      // 7. Idiom ko→en
      questions.push({
        type: 'idiom_ko_to_en',
        word: v.front_text,
        prompt: `다음 뜻에 해당하는 영어 숙어를 쓰세요.\n"${idiom.ko}"`,
        reference: idiom.en,
      });

      // 8. Example translate
      if (idiom.example_en && idiom.example_ko) {
        questions.push({
          type: 'idiom_example_translate',
          word: v.front_text,
          prompt: `다음 문장을 한국어로 해석하세요.\n"${idiom.example_en}"`,
          reference: idiom.example_ko,
        });
      }

      // 9. Writing (~10% so limit)
      if (idiom.example_ko && idiom.example_en && Math.random() < 0.3) {
        questions.push({
          type: 'idiom_writing',
          word: v.front_text,
          prompt: `다음 문장을 영어로 쓰세요.\n"${idiom.example_ko}"`,
          reference: idiom.example_en,
        });
      }
    }
  }

  return shuffle(questions);
}
