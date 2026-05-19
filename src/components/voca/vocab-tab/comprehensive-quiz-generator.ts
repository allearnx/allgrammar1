import { shuffle, blankOutWord } from '@/lib/utils';
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
  | 'word_arrange';    // 9. 단어 배열 영작

export interface BaseQuestion {
  type: QuestionType;
  word: string;
  prompt: string;
  reference: string;
}

export interface MCQuestion extends BaseQuestion {
  type: 'mc_synonym' | 'mc_antonym' | 'idiom_en_to_ko';
  choices: string[];
  correctIndex: number;
}

export interface ShortQuestion extends BaseQuestion {
  type: 'short_synonym' | 'short_antonym' | 'fill_blank';
  acceptedAnswers: string[];
}

export interface AIQuestion extends BaseQuestion {
  type: 'idiom_ko_to_en' | 'idiom_example_translate';
}

export interface ArrangeQuestion extends BaseQuestion {
  type: 'word_arrange';
  scrambledWords: string[];
}

export type Question = MCQuestion | ShortQuestion | AIQuestion | ArrangeQuestion;

export interface QuestionResult {
  question: Question;
  studentAnswer: string;
  score: number;
  feedback: string;
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
    const word = v.front_text.trim().toLowerCase();
    const blanked = blankOutWord(sentence, word);
    if (blanked === sentence) continue;
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
  // Collect all idiom Korean meanings for MC distractors
  const allIdiomKo = withIdioms.flatMap((v) => v.idioms!.map((id) => id.ko));

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
      const distractors = shuffle(allIdiomKo.filter((ko) => ko !== idiom.ko)).slice(0, 4);
      if (distractors.length >= 4) {
        const choices = shuffle([idiom.ko, ...distractors]);
        questions.push({
          type: 'idiom_en_to_ko',
          word: v.front_text,
          prompt: `다음 숙어의 뜻을 고르세요.\n"${idiom.en}"`,
          reference: idiom.ko,
          choices,
          correctIndex: choices.indexOf(idiom.ko),
        });
      } else {
        // 보기가 부족하면 예문 해석으로 대체
        if (idiom.example_en && idiom.example_ko) {
          questions.push({
            type: 'idiom_example_translate',
            word: v.front_text,
            prompt: `다음 문장을 한국어로 해석하세요.\n"${idiom.example_en}"`,
            reference: idiom.example_ko,
          });
        }
      }
    } else {
      questions.push({
        type: 'idiom_example_translate',
        word: v.front_text,
        prompt: `다음 문장을 한국어로 해석하세요.\n"${idiom.example_en}"`,
        reference: idiom.example_ko!,
      });
    }
  }

  // 5. 단어 배열 영작 (max 1) — 한국어 해석 + 셔플된 영단어 → 올바른 순서로 배열
  const arrangeCandidates = shuffle(
    vocabulary.filter((v) => v.example_sentence && v.example_sentence_ko && !usedWords.has(v.front_text))
  );
  if (arrangeCandidates.length > 0) {
    const v = arrangeCandidates[0];
    const words = v.example_sentence!.replace(/[.!?,"';:]/g, '').split(/\s+/).filter(Boolean);
    if (words.length >= 3) {
      usedWords.add(v.front_text);
      questions.push({
        type: 'word_arrange',
        word: v.front_text,
        prompt: `다음 뜻에 맞게 단어를 배열하세요.\n"${v.example_sentence_ko}"`,
        reference: v.example_sentence!,
        scrambledWords: shuffle(words),
      });
    }
  }

  return shuffle(questions);
}
