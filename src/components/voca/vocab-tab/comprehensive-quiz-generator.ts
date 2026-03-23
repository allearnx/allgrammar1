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
  const withIdioms = shuffle(vocabulary.filter((v) => v.idioms && v.idioms.length > 0));

  // All synonym/antonym values for distractor generation
  const allSynonyms = withSynonyms.map((v) => v.synonyms!.split(',')[0].trim()).filter(Boolean);
  const allAntonyms = withAntonyms.map((v) => v.antonyms!.split(',')[0].trim()).filter(Boolean);

  // Global: each word appears in at most ONE question
  const usedWords = new Set<string>();

  // 1. MC synonym (max 3)
  if (withSynonyms.length >= 1 && allSynonyms.length >= 4) {
    let count = 0;
    for (const v of withSynonyms) {
      if (count >= 3 || usedWords.has(v.front_text)) continue;
      const correct = v.synonyms!.split(',')[0].trim();
      const distractors = shuffle(allSynonyms.filter((s) => s !== correct)).slice(0, 4);
      if (distractors.length < 4) continue;
      const choices = shuffle([correct, ...distractors]);
      usedWords.add(v.front_text);
      count++;
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

  // 2. MC antonym (max 3)
  if (withAntonyms.length >= 1 && allAntonyms.length >= 4) {
    let count = 0;
    for (const v of withAntonyms) {
      if (count >= 3 || usedWords.has(v.front_text)) continue;
      const correct = v.antonyms!.split(',')[0].trim();
      const distractors = shuffle(allAntonyms.filter((s) => s !== correct)).slice(0, 4);
      if (distractors.length < 4) continue;
      const choices = shuffle([correct, ...distractors]);
      usedWords.add(v.front_text);
      count++;
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

  // 3. Fill blank (max 2) — skip already-used words
  let fillCount = 0;
  for (const v of withExample) {
    if (fillCount >= 2 || usedWords.has(v.front_text)) continue;
    const sentence = v.example_sentence!;
    const word = v.front_text.toLowerCase();
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (!regex.test(sentence)) continue;
    const blanked = sentence.replace(regex, '________');
    usedWords.add(v.front_text);
    fillCount++;
    questions.push({
      type: 'fill_blank',
      word: v.front_text,
      prompt: `다음 빈칸에 알맞은 단어를 쓰세요.\n\n${blanked}\n\n💡 뜻: ${v.back_text}`,
      reference: v.front_text,
      acceptedAnswers: [word],
    });
  }

  // 4. Idiom questions — 1 question per word (max 4), pick one random idiom per word
  let idiomCount = 0;
  for (const v of withIdioms) {
    if (idiomCount >= 4 || usedWords.has(v.front_text)) continue;
    usedWords.add(v.front_text);
    idiomCount++;
    // Pick one random idiom from the word's idiom list
    const idiom = v.idioms![Math.floor(Math.random() * v.idioms!.length)];
    const types: QuestionType[] = ['idiom_en_to_ko'];
    if (idiom.example_en && idiom.example_ko) types.push('idiom_example_translate');
    const pickedType = types[Math.floor(Math.random() * types.length)];

    if (pickedType === 'idiom_en_to_ko') {
      questions.push({
        type: 'idiom_en_to_ko',
        word: v.front_text,
        prompt: `다음 숙어의 뜻을 한국어로 쓰세요.\n"${idiom.en}"`,
        reference: idiom.ko,
      });
    } else {
      questions.push({
        type: 'idiom_example_translate',
        word: v.front_text,
        prompt: `다음 문장을 한국어로 해석하세요.\n"${idiom.example_en}"`,
        reference: idiom.example_ko!,
      });
    }
  }

  return shuffle(questions);
}
