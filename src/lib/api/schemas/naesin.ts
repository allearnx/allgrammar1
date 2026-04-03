import { z } from 'zod';
import { ID, SHORT, MEDIUM, LONG, URL_STR } from './_shared';

// ── Student Progress Schemas ──

export const vocabProgressSchema = z.object({
  unitId: ID,
  type: z.enum(['flashcard', 'quiz', 'spelling']),
  score: z.number().nullish(),
  totalItems: z.number().nullish(),
});

export const grammarProgressSchema = z.object({
  unitId: ID,
  type: z.enum(['video', 'text']),
});

export const passageProgressSchema = z.object({
  unitId: ID,
  type: z.enum(['fill_blanks', 'ordering', 'translation', 'grammar_vocab']),
  score: z.number(),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullish(),
  round: z.enum(['1', '2']).default('1'),
});

export const videoProgressSchema = z.object({
  lessonId: ID,
  unitId: ID.nullish(),
  position: z.number().nullish(),
  duration: z.number().nullish(),
  cumulativeSeconds: z.number().nullish(),
});

export const textbookVideoProgressSchema = z.object({
  lessonId: ID,
  unitId: ID.nullish(),
  position: z.number().nullish(),
  duration: z.number().nullish(),
  cumulativeSeconds: z.number().nullish(),
});

export const omrSubmitSchema = z.object({
  unitId: ID,
  omrSheetId: ID,
  studentAnswers: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
});

export const problemSubmitSchema = z.object({
  sheetId: ID,
  unitId: ID.nullish(),
  answers: z.array(z.unknown()),
  totalQuestions: z.number(),
  aiResults: z.record(z.string(), z.object({
    score: z.number(),
    feedback: z.string(),
    correctedAnswer: z.string(),
  })).nullish(),
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
  resolved: z.boolean().nullish(),
});

// ── Quiz & Grade Schemas ──

export const quizSetResultSchema = z.object({
  quizSetId: ID,
  unitId: ID.nullish(),
  score: z.number(),
  wrongWords: z.array(z.unknown()).nullish(),
});

export const gradeTranslationSchema = z.object({
  koreanText: LONG,
  originalText: LONG,
  studentAnswer: LONG,
});

export const gradeTranslationBatchSchema = z.object({
  sentences: z.array(z.object({
    koreanText: LONG,
    originalText: LONG,
    studentAnswer: LONG,
  })).min(1).max(30),
});

export const gradeSubjectiveSchema = z.object({
  question: LONG,
  referenceAnswer: LONG,
  studentAnswer: LONG,
});

export const legacyVideoProgressSchema = z.object({
  grammarId: ID,
  position: z.number(),
  completed: z.boolean().nullish(),
});

// ── Admin CRUD Schemas ──

export const textbookCreateSchema = z.object({
  grade: SHORT,
  publisher: SHORT,
  display_name: SHORT,
  sort_order: z.number().nullish(),
});

export const textbookPatchSchema = z.object({
  id: ID,
}).passthrough();

export const unitCreateSchema = z.object({
  textbook_id: ID,
  unit_number: z.number(),
  title: SHORT,
  sort_order: z.number().nullish(),
});

export const unitPatchSchema = z.object({
  id: ID,
}).passthrough();

export const vocabCreateSchema = z.object({
  unit_id: ID,
  front_text: SHORT,
  back_text: SHORT,
  part_of_speech: SHORT.nullish(),
  example_sentence: MEDIUM.nullish(),
  synonyms: SHORT.nullish(),
  antonyms: SHORT.nullish(),
  sort_order: z.number().nullish(),
});

export const vocabPatchSchema = z.object({
  id: ID,
  front_text: SHORT.nullish(),
  back_text: SHORT.nullish(),
  part_of_speech: SHORT.nullish(),
  example_sentence: MEDIUM.nullish(),
  synonyms: SHORT.nullish(),
  antonyms: SHORT.nullish(),
});

export const vocabBulkSchema = z.object({
  unit_id: ID,
  items: z.array(z.object({
    front_text: SHORT,
    back_text: SHORT,
    part_of_speech: SHORT.nullish(),
    example_sentence: MEDIUM.nullish(),
    synonyms: SHORT.nullish(),
    antonyms: SHORT.nullish(),
  })).min(1).max(500),
});

export const passageCreateSchema = z.object({
  unit_id: ID,
  title: SHORT,
  original_text: LONG,
  korean_translation: LONG,
  blanks_easy: z.unknown().nullish(),
  blanks_medium: z.unknown().nullish(),
  blanks_hard: z.unknown().nullish(),
  sentences: z.unknown().nullish(),
  grammar_vocab_items: z.unknown().nullish(),
  pdf_url: URL_STR.nullish(),
  sort_order: z.number().nullish(),
});

export const grammarLessonCreateSchema = z.object({
  unit_id: ID,
  title: SHORT,
  content_type: SHORT,
  youtube_url: URL_STR.nullish(),
  youtube_video_id: SHORT.nullish(),
  video_duration_seconds: z.number().nullish(),
  text_content: LONG.nullish(),
  sort_order: z.number().nullish(),
});

export const omrSheetCreateSchema = z.object({
  unit_id: ID,
  title: SHORT,
  total_questions: z.number(),
  answer_key: z.array(z.unknown()).max(200),
  points_per_question: z.number().nullish(),
  sort_order: z.number().nullish(),
});

export const textbookVideoCreateSchema = z.object({
  unitId: ID,
  title: SHORT,
  youtubeUrl: URL_STR,
});

export const problemCreateSchema = z.object({
  unitId: ID,
  title: SHORT,
  mode: SHORT,
  questions: z.unknown().nullish(),
  pdfUrl: URL_STR.nullish(),
  answerKey: z.unknown().nullish(),
  category: SHORT.nullish(),
});

export const problemPatchSchema = z.object({
  id: ID,
}).passthrough();

export const vocabQuizSetCreateSchema = z.object({
  unitId: ID,
  title: SHORT,
  vocabIds: z.array(ID).min(1).max(500),
});

export const similarProblemPatchSchema = z.object({
  id: ID,
  status: SHORT.nullish(),
  questionData: z.unknown().nullish(),
  rejectionReason: z.enum([
    'wrong_answer',
    'grammar_error',
    'too_easy',
    'too_hard',
    'ambiguous',
    'duplicate',
    'other',
  ]).nullish(),
});

export const problemValidateSchema = z.object({
  questions: z.array(z.object({
    number: z.number(),
    question: z.string(),
    options: z.array(z.string()).nullish(),
    answer: z.union([z.string(), z.number()]),
    explanation: z.string().nullish(),
  })).min(1).max(200),
  skipAi: z.boolean().nullish(),
});

export const lastReviewCreateSchema = z.object({
  unitId: ID,
  contentType: SHORT,
  title: SHORT,
  youtubeUrl: URL_STR.nullish(),
  youtubeVideoId: SHORT.nullish(),
  pdfUrl: URL_STR.nullish(),
  textContent: LONG.nullish(),
});

export const examDateSchema = z.object({
  textbookId: ID,
  examDate: SHORT,
});

export const examAssignmentUpsertSchema = z.object({
  studentId: ID,
  textbookId: ID,
  examRound: z.number().min(1).max(10),
  examLabel: SHORT.nullish(),
  examDate: SHORT.nullish(),
  unitIds: z.array(ID).min(1).max(20),
});

export const examAssignmentDeleteSchema = z.object({
  studentId: ID,
  textbookId: ID,
  examRound: z.number(),
});

export const settingsSchema = z.object({
  textbookId: ID,
  studentId: ID.optional(),
});

export const idSchema = z.object({
  id: ID,
});

export const similarProblemGenerateSchema = z.object({
  unitId: ID,
  wrongAnswerIds: z.array(ID).nullish(),
  grammarTag: SHORT.nullish(),
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
  correctCount: z.number().nullish(),
  wrongWords: z.array(z.unknown()).nullish(),
});

export const reportGenerateSchema = z.object({
  studentId: ID,
  reportType: z.enum(['all', 'naesin', 'voca']).default('all'),
});

// ── Grammar Socratic Chat Schemas ──

export const grammarChatStartSchema = z.object({
  lessonId: ID,
});

export const grammarChatReplySchema = z.object({
  sessionId: ID,
  message: LONG,
});

// ── 교재 OMR Schemas ──

export const workbookCreateSchema = z.object({
  title: SHORT,
  publisher: SHORT,
  grade: z.number().min(1).max(3),
  cover_image_url: URL_STR.nullish(),
  sort_order: z.number().nullish(),
});

export const workbookPatchSchema = z.object({
  id: ID,
}).passthrough();

export const workbookOmrSheetCreateSchema = z.object({
  workbook_id: ID,
  title: SHORT,
  total_questions: z.number().min(1).max(200),
  answer_key: z.array(z.number()).min(1).max(200),
  sort_order: z.number().nullish(),
});

export const workbookOmrSubmitSchema = z.object({
  omrSheetId: ID,
  studentAnswers: z.array(z.number()).min(1).max(200),
});

export const grammarChatQuestionCreateSchema = z.object({
  lessonId: ID,
  questionText: LONG,
  grammarConcept: MEDIUM.nullish(),
  hint: MEDIUM.nullish(),
  expectedAnswerKeywords: z.array(SHORT).nullish(),
  sortOrder: z.number().nullish(),
});

// ── Learning Session Schemas ──

export const aiAnalysisSchema = z.object({
  studentId: ID,
});

export const learningSessionHeartbeatSchema = z.object({
  contextType: z.enum(['naesin', 'voca']),
  contextId: z.string().max(100),
  seconds: z.number().int().min(1).max(120),
});
