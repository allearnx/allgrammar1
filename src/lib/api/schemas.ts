import { z } from 'zod';

// ── Shared Limits ──
const ID = z.string().max(100);
const SHORT = z.string().max(200);
const MEDIUM = z.string().max(1000);
const LONG = z.string().max(10000);
const URL_STR = z.string().max(2000);

// ── Student Progress Schemas ──

export const vocabProgressSchema = z.object({
  unitId: ID,
  type: z.enum(['flashcard', 'quiz', 'spelling']),
  score: z.number().optional(),
  totalItems: z.number().optional(),
});

export const grammarProgressSchema = z.object({
  unitId: ID,
  type: z.enum(['video', 'text']),
});

export const passageProgressSchema = z.object({
  unitId: ID,
  type: z.enum(['fill_blanks', 'ordering', 'translation']),
  score: z.number(),
});

export const videoProgressSchema = z.object({
  lessonId: ID,
  unitId: ID.optional(),
  position: z.number().optional(),
  duration: z.number().optional(),
  cumulativeSeconds: z.number().optional(),
});

export const omrSubmitSchema = z.object({
  unitId: ID,
  omrSheetId: ID,
  studentAnswers: z.record(z.string(), z.unknown()),
  correctCount: z.number(),
  totalQuestions: z.number(),
  scorePercent: z.number(),
});

export const problemSubmitSchema = z.object({
  sheetId: ID,
  unitId: ID.optional(),
  answers: z.array(z.unknown()),
  totalQuestions: z.number(),
});

// ── Wrong Answers Schemas ──

export const wrongAnswerCreateSchema = z.object({
  unitId: ID,
  stage: SHORT,
  sourceType: SHORT,
  wrongAnswers: z.array(z.unknown()).min(1),
});

export const wrongAnswerPatchSchema = z.object({
  id: ID,
  resolved: z.boolean().optional(),
});

// ── Quiz & Grade Schemas ──

export const quizSetResultSchema = z.object({
  quizSetId: ID,
  unitId: ID.optional(),
  score: z.number(),
  wrongWords: z.array(z.unknown()).optional(),
});

export const gradeTranslationSchema = z.object({
  koreanText: LONG,
  originalText: LONG,
  studentAnswer: LONG,
});

export const legacyVideoProgressSchema = z.object({
  grammarId: ID,
  position: z.number(),
  completed: z.boolean().optional(),
});

// ── Admin CRUD Schemas ──

export const textbookCreateSchema = z.object({
  grade: SHORT,
  publisher: SHORT,
  display_name: SHORT,
  sort_order: z.number().optional(),
});

export const textbookPatchSchema = z.object({
  id: ID,
}).passthrough();

export const unitCreateSchema = z.object({
  textbook_id: ID,
  unit_number: z.number(),
  title: SHORT,
  sort_order: z.number().optional(),
});

export const unitPatchSchema = z.object({
  id: ID,
}).passthrough();

export const vocabCreateSchema = z.object({
  unit_id: ID,
  front_text: SHORT,
  back_text: SHORT,
  part_of_speech: SHORT.optional(),
  example_sentence: MEDIUM.optional(),
  synonyms: SHORT.optional(),
  antonyms: SHORT.optional(),
  sort_order: z.number().optional(),
});

export const vocabPatchSchema = z.object({
  id: ID,
  front_text: SHORT.optional(),
  back_text: SHORT.optional(),
  part_of_speech: SHORT.optional(),
  example_sentence: MEDIUM.optional(),
  synonyms: SHORT.optional(),
  antonyms: SHORT.optional(),
});

export const vocabBulkSchema = z.object({
  unit_id: ID,
  items: z.array(z.object({
    front_text: SHORT,
    back_text: SHORT,
    part_of_speech: SHORT.optional(),
    example_sentence: MEDIUM.optional(),
    synonyms: SHORT.optional(),
    antonyms: SHORT.optional(),
  })).min(1).max(500),
});

export const passageCreateSchema = z.object({
  unit_id: ID,
  title: SHORT,
  original_text: LONG,
  korean_translation: LONG,
  blanks_easy: z.unknown().optional(),
  blanks_medium: z.unknown().optional(),
  blanks_hard: z.unknown().optional(),
  sentences: z.unknown().optional(),
  sort_order: z.number().optional(),
});

export const grammarLessonCreateSchema = z.object({
  unit_id: ID,
  title: SHORT,
  content_type: SHORT,
  youtube_url: URL_STR.optional(),
  youtube_video_id: SHORT.optional(),
  video_duration_seconds: z.number().optional(),
  text_content: LONG.optional(),
  sort_order: z.number().optional(),
});

export const omrSheetCreateSchema = z.object({
  unit_id: ID,
  title: SHORT,
  total_questions: z.number(),
  answer_key: z.array(z.unknown()).max(200),
  points_per_question: z.number().optional(),
  sort_order: z.number().optional(),
});

export const problemCreateSchema = z.object({
  unitId: ID,
  title: SHORT,
  mode: SHORT,
  questions: z.unknown().optional(),
  pdfUrl: URL_STR.optional(),
  answerKey: z.unknown().optional(),
  category: SHORT.optional(),
});

export const vocabQuizSetCreateSchema = z.object({
  unitId: ID,
  title: SHORT,
  vocabIds: z.array(ID).min(1).max(500),
});

export const similarProblemPatchSchema = z.object({
  id: ID,
  status: SHORT.optional(),
  questionData: z.unknown().optional(),
});

export const lastReviewCreateSchema = z.object({
  unitId: ID,
  contentType: SHORT,
  title: SHORT,
  youtubeUrl: URL_STR.optional(),
  youtubeVideoId: SHORT.optional(),
  pdfUrl: URL_STR.optional(),
  textContent: LONG.optional(),
});

export const examDateSchema = z.object({
  textbookId: ID,
  examDate: SHORT,
});

export const settingsSchema = z.object({
  textbookId: ID,
});

export const idSchema = z.object({
  id: ID,
});

// ── Boss/Admin Schemas ──

export const academyCreateSchema = z.object({
  name: z.string().min(1).max(100),
});

export const userPatchSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin', 'boss']).optional(),
  academy_id: ID.nullable().optional(),
  is_active: z.boolean().optional(),
});

export const teacherPatchSchema = z.object({
  is_active: z.boolean(),
});

export const similarProblemGenerateSchema = z.object({
  unitId: ID,
  wrongAnswerIds: z.array(ID).optional(),
  grammarTag: SHORT.optional(),
});

// ── Memory & Textbook Schemas ──

export const memoryProgressSchema = z.object({
  memoryItemId: ID,
  testType: z.enum(['flashcard', 'quiz', 'spelling']),
  isCorrect: z.boolean(),
});

export const textbookProgressSchema = z.object({
  passageId: ID,
  type: z.enum(['fill_blanks_easy', 'fill_blanks_medium', 'fill_blanks_hard', 'ordering', 'translation']),
  score: z.number(),
});

export const quizResultCreateSchema = z.object({
  unitId: ID,
  score: z.number(),
  totalQuestions: z.number(),
  correctCount: z.number().optional(),
  wrongWords: z.array(z.unknown()).optional(),
});

export const reportGenerateSchema = z.object({
  studentId: ID,
});
