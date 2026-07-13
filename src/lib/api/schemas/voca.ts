import { z } from 'zod';
import { ID, SHORT, MEDIUM } from './_shared';

// ── 올킬보카 Schemas ──

export const vocaBookCreateSchema = z.object({
  title: SHORT,
  description: MEDIUM.nullish(),
  cover_image_url: z.string().url().nullish(),
  definition_lang: z.enum(['ko', 'en']).optional(), // null 불가 — DB not null (default 'ko')
  sort_order: z.number().nullish(),
});

export const vocaBookPatchSchema = z.object({
  id: ID,
}).passthrough();

export const vocaDayCreateSchema = z.object({
  book_id: ID,
  day_number: z.number(),
  title: SHORT,
  sort_order: z.number().nullish(),
});

export const vocaVocabCreateSchema = z.object({
  day_id: ID,
  front_text: SHORT,
  back_text: SHORT,
  part_of_speech: SHORT.nullish(),
  example_sentence: MEDIUM.nullish(),
  example_sentence_ko: MEDIUM.nullish(),
  synonyms: SHORT.nullish(),
  antonyms: SHORT.nullish(),
  spelling_hint: SHORT.nullish(),
  spelling_answer: SHORT.nullish(),
  sort_order: z.number().nullish(),
});

export const vocaVocabPatchSchema = z.object({
  id: ID,
}).passthrough();

export const vocaVocabBulkSchema = z.object({
  day_id: ID,
  items: z.array(z.object({
    front_text: SHORT,
    back_text: SHORT,
    part_of_speech: SHORT.nullish(),
    example_sentence: MEDIUM.nullish(),
    example_sentence_ko: MEDIUM.nullish(),
    synonyms: SHORT.nullish(),
    antonyms: SHORT.nullish(),
    spelling_hint: SHORT.nullish(),
    spelling_answer: SHORT.nullish(),
    exam_source: SHORT.nullish(), // 기출 지문에서 추출 시 출처 라벨
    idioms: z.array(z.object({
      en: z.string(),
      ko: z.string(),
      example_en: z.string().optional(),
      example_ko: z.string().optional(),
    })).nullish(),
  })).min(1).max(500),
});

export const vocaProgressSaveSchema = z.object({
  dayId: ID,
  type: z.enum(['flashcard', 'quiz', 'spelling', 'matching', 'exam']),
  score: z.number().nullish(),
  matchingAttempt: z.number().nullish(),
  round: z.enum(['1', '2']).default('1'),
  spellingWrongWords: z.array(z.object({
    front_text: z.string(),
    back_text: z.string(),
  })).nullish(),
});

// 묶음 보너스 시험 (Day 1~3개) 결과 저장
export const vocaExamSaveSchema = z.object({
  bookId: ID,
  dayIds: z.array(ID).min(1).max(3),
  score: z.number().int().min(0).max(100),
  wrongWords: z.array(z.object({
    front_text: z.string(),
    back_text: z.string(),
  })).nullish(),
  assignmentId: ID.nullish(), // 선생님 배정 시험이면 연결
});

// 선생님 배정형 시험 생성 (학생들에게 Day 묶음 시험 배정)
export const vocaExamAssignmentCreateSchema = z.object({
  bookId: ID,
  dayIds: z.array(ID).min(1).max(3),
  studentIds: z.array(ID).min(1).max(200),
  title: z.string().trim().max(100).nullish(),
});

export const vocaExamAssignmentDeleteSchema = z.object({
  id: ID,
});

export const vocaMatchingSubmissionSchema = z.object({
  dayId: ID,
  wrongWords: z.array(z.object({
    word: SHORT,
    match: SHORT,
    type: z.enum(['synonym', 'antonym', 'sentence']),
  })),
  writings: z.array(z.object({
    word: SHORT,
    attempts: z.array(SHORT),
  })),
});

export const vocaMatchingReviewSchema = z.object({
  id: ID,
  status: z.enum(['pending', 'reviewed']),
});

export const vocaDaysWithVocabSchema = z.object({
  book_id: ID,
  words_per_day: z.number().min(1).max(200).default(30),
  items: z.array(z.object({
    front_text: SHORT,
    back_text: SHORT,
    part_of_speech: SHORT.nullish(),
    example_sentence: MEDIUM.nullish(),
    example_sentence_ko: MEDIUM.nullish(),
    synonyms: SHORT.nullish(),
    antonyms: SHORT.nullish(),
    spelling_hint: SHORT.nullish(),
    spelling_answer: SHORT.nullish(),
    exam_source: SHORT.nullish(), // 기출 지문에서 추출 시 출처 라벨
    idioms: z.array(z.object({
      en: z.string(),
      ko: z.string(),
      example_en: z.string().optional(),
      example_ko: z.string().optional(),
    })).nullish(),
  })).min(1).max(2000),
});

// ── 보카 교재 배정 Schemas ──

export const vocaBookAssignmentSchema = z.object({
  studentId: ID,
  bookId: ID,
});

export const vocaBookAssignmentDeleteSchema = z.object({
  studentId: ID,
});
