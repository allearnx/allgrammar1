import { z } from 'zod';

// ── Student Progress Schemas ──

export const vocabProgressSchema = z.object({
  unitId: z.string(),
  type: z.enum(['flashcard', 'quiz', 'spelling']),
  score: z.number().optional(),
  totalItems: z.number().optional(),
});

export const grammarProgressSchema = z.object({
  unitId: z.string(),
  type: z.enum(['video', 'text']),
});

export const passageProgressSchema = z.object({
  unitId: z.string(),
  type: z.enum(['fill_blanks', 'ordering', 'translation']),
  score: z.number(),
});

export const videoProgressSchema = z.object({
  lessonId: z.string(),
  unitId: z.string().optional(),
  position: z.number().optional(),
  duration: z.number().optional(),
  cumulativeSeconds: z.number().optional(),
});

export const omrSubmitSchema = z.object({
  unitId: z.string(),
  omrSheetId: z.string(),
  studentAnswers: z.record(z.string(), z.unknown()),
  correctCount: z.number(),
  totalQuestions: z.number(),
  scorePercent: z.number(),
});

export const problemSubmitSchema = z.object({
  sheetId: z.string(),
  unitId: z.string().optional(),
  answers: z.array(z.unknown()),
  totalQuestions: z.number(),
});

// ── Wrong Answers Schemas ──

export const wrongAnswerCreateSchema = z.object({
  unitId: z.string(),
  stage: z.string(),
  sourceType: z.string(),
  wrongAnswers: z.array(z.unknown()).min(1),
});

export const wrongAnswerPatchSchema = z.object({
  id: z.string(),
  resolved: z.boolean().optional(),
});

// ── Quiz & Grade Schemas ──

export const quizSetResultSchema = z.object({
  quizSetId: z.string(),
  unitId: z.string().optional(),
  score: z.number(),
  wrongWords: z.array(z.unknown()).optional(),
});

export const gradeTranslationSchema = z.object({
  koreanText: z.string(),
  originalText: z.string(),
  studentAnswer: z.string(),
});

export const legacyVideoProgressSchema = z.object({
  grammarId: z.string(),
  position: z.number(),
  completed: z.boolean().optional(),
});

// ── Admin CRUD Schemas ──

export const textbookCreateSchema = z.object({
  grade: z.string(),
  publisher: z.string(),
  display_name: z.string(),
  sort_order: z.number().optional(),
});

export const textbookPatchSchema = z.object({
  id: z.string(),
}).passthrough();

export const unitCreateSchema = z.object({
  textbook_id: z.string(),
  unit_number: z.number(),
  title: z.string(),
  sort_order: z.number().optional(),
});

export const unitPatchSchema = z.object({
  id: z.string(),
}).passthrough();

export const vocabCreateSchema = z.object({
  unit_id: z.string(),
  front_text: z.string(),
  back_text: z.string(),
  part_of_speech: z.string().optional(),
  example_sentence: z.string().optional(),
  synonyms: z.string().optional(),
  antonyms: z.string().optional(),
  sort_order: z.number().optional(),
});

export const vocabPatchSchema = z.object({
  id: z.string(),
  front_text: z.string().optional(),
  back_text: z.string().optional(),
  part_of_speech: z.string().optional(),
  example_sentence: z.string().optional(),
  synonyms: z.string().optional(),
  antonyms: z.string().optional(),
});

export const vocabBulkSchema = z.object({
  unit_id: z.string(),
  items: z.array(z.object({
    front_text: z.string(),
    back_text: z.string(),
    part_of_speech: z.string().optional(),
    example_sentence: z.string().optional(),
    synonyms: z.string().optional(),
    antonyms: z.string().optional(),
  })).min(1),
});

export const passageCreateSchema = z.object({
  unit_id: z.string(),
  title: z.string(),
  original_text: z.string(),
  korean_translation: z.string(),
  blanks_easy: z.unknown().optional(),
  blanks_medium: z.unknown().optional(),
  blanks_hard: z.unknown().optional(),
  sentences: z.unknown().optional(),
  sort_order: z.number().optional(),
});

export const grammarLessonCreateSchema = z.object({
  unit_id: z.string(),
  title: z.string(),
  content_type: z.string(),
  youtube_url: z.string().optional(),
  youtube_video_id: z.string().optional(),
  video_duration_seconds: z.number().optional(),
  text_content: z.string().optional(),
  sort_order: z.number().optional(),
});

export const omrSheetCreateSchema = z.object({
  unit_id: z.string(),
  title: z.string(),
  total_questions: z.number(),
  answer_key: z.array(z.unknown()),
  points_per_question: z.number().optional(),
  sort_order: z.number().optional(),
});

export const problemCreateSchema = z.object({
  unitId: z.string(),
  title: z.string(),
  mode: z.string(),
  questions: z.unknown().optional(),
  pdfUrl: z.string().optional(),
  answerKey: z.unknown().optional(),
  category: z.string().optional(),
});

export const vocabQuizSetCreateSchema = z.object({
  unitId: z.string(),
  title: z.string(),
  vocabIds: z.array(z.string()).min(1),
});

export const similarProblemPatchSchema = z.object({
  id: z.string(),
  status: z.string().optional(),
  questionData: z.unknown().optional(),
});

export const lastReviewCreateSchema = z.object({
  unitId: z.string(),
  contentType: z.string(),
  title: z.string(),
  youtubeUrl: z.string().optional(),
  youtubeVideoId: z.string().optional(),
  pdfUrl: z.string().optional(),
  textContent: z.string().optional(),
});

export const examDateSchema = z.object({
  textbookId: z.string(),
  examDate: z.string(),
});

export const settingsSchema = z.object({
  textbookId: z.string(),
});

export const idSchema = z.object({
  id: z.string(),
});

// ── Boss/Admin Schemas ──

export const academyCreateSchema = z.object({
  name: z.string().min(1),
});

export const userPatchSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin', 'boss']).optional(),
  academy_id: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const teacherPatchSchema = z.object({
  is_active: z.boolean(),
});

export const similarProblemGenerateSchema = z.object({
  unitId: z.string(),
  wrongAnswerIds: z.array(z.string()).optional(),
  grammarTag: z.string().optional(),
});

// ── Memory & Textbook Schemas ──

export const memoryProgressSchema = z.object({
  memoryItemId: z.string(),
  testType: z.enum(['flashcard', 'quiz', 'spelling']),
  isCorrect: z.boolean(),
});

export const textbookProgressSchema = z.object({
  passageId: z.string(),
  type: z.enum(['fill_blanks_easy', 'fill_blanks_medium', 'fill_blanks_hard', 'ordering', 'translation']),
  score: z.number(),
});

export const quizResultCreateSchema = z.object({
  unitId: z.string(),
  score: z.number(),
  totalQuestions: z.number(),
  correctCount: z.number().optional(),
  wrongWords: z.array(z.unknown()).optional(),
});

export const reportGenerateSchema = z.object({
  studentId: z.string(),
});
