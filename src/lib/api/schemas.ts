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
});

export const videoProgressSchema = z.object({
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
});

export const idSchema = z.object({
  id: ID,
});

// ── Boss/Admin Schemas ──

export const academyCreateSchema = z.object({
  name: z.string().min(1).max(100),
});

export const inviteCodeSchema = z.object({
  code: z.string().length(6).regex(/^[A-Z0-9]+$/),
});

export const userPatchSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin', 'boss']).nullish(),
  academy_id: ID.nullish(),
  is_active: z.boolean().nullish(),
});

export const teacherPatchSchema = z.object({
  is_active: z.boolean(),
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

// ── 올킬보카 Schemas ──

export const vocaBookCreateSchema = z.object({
  title: SHORT,
  description: MEDIUM.nullish(),
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
    synonyms: SHORT.nullish(),
    antonyms: SHORT.nullish(),
    spelling_hint: SHORT.nullish(),
    spelling_answer: SHORT.nullish(),
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
  type: z.enum(['flashcard', 'quiz', 'spelling', 'matching']),
  score: z.number().nullish(),
  matchingAttempt: z.number().nullish(),
  round: z.enum(['1', '2']).default('1'),
});

export const vocaMatchingSubmissionSchema = z.object({
  dayId: ID,
  wrongWords: z.array(z.object({
    word: SHORT,
    match: SHORT,
    type: z.enum(['synonym', 'antonym']),
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
    synonyms: SHORT.nullish(),
    antonyms: SHORT.nullish(),
    spelling_hint: SHORT.nullish(),
    spelling_answer: SHORT.nullish(),
    idioms: z.array(z.object({
      en: z.string(),
      ko: z.string(),
      example_en: z.string().optional(),
      example_ko: z.string().optional(),
    })).nullish(),
  })).min(1).max(2000),
});

// ── 서비스 배정 Schemas ──

export const serviceAssignmentCreateSchema = z.object({
  studentId: ID,
  service: z.enum(['naesin', 'voca']),
});

export const serviceAssignmentDeleteSchema = z.object({
  studentId: ID,
  service: z.enum(['naesin', 'voca']),
});

export const serviceAssignmentPatchSchema = z.object({
  studentId: ID,
  round2Unlocked: z.boolean(),
});

// ── 보카 교재 배정 Schemas ──

export const vocaBookAssignmentSchema = z.object({
  studentId: ID,
  bookId: ID,
});

export const vocaBookAssignmentDeleteSchema = z.object({
  studentId: ID,
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

// ── 결제/구독 Schemas ──

export const subscriptionPlanCreateSchema = z.object({
  name: SHORT,
  target: z.enum(['academy', 'individual']),
  services: z.array(z.enum(['naesin', 'voca'])).min(1),
  price_per_unit: z.number().min(0),
  min_students: z.number().min(1).nullish(),
  description: MEDIUM.nullish(),
  sort_order: z.number().nullish(),
});

export const subscriptionPlanPatchSchema = z.object({
  id: ID,
  name: SHORT.nullish(),
  services: z.array(z.enum(['naesin', 'voca'])).min(1).nullish(),
  price_per_unit: z.number().min(0).nullish(),
  min_students: z.number().min(1).nullish(),
  description: MEDIUM.nullish(),
  is_active: z.boolean().nullish(),
  sort_order: z.number().nullish(),
});

export const billingRegisterCardSchema = z.object({
  authKey: z.string().min(1),
  customerKey: z.string().min(1),
});

export const subscriptionCancelSchema = z.object({
  subscriptionId: ID,
});

export const paymentConfirmSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().min(100),
  orderName: z.string().min(1),
  courseId: z.string().uuid().optional(),
});

// ── Academy Settings Schemas ──

export const academySettingsSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  contact_phone: z.string().max(20).nullish(),
  contact_email: z.string().email().max(200).nullish(),
  address: z.string().max(500).nullish(),
  logo_url: URL_STR.nullish(),
  business_number: z.string().max(20).nullish(),
});

export const academyPatchSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  max_students: z.number().min(1).nullish(),
  services: z.array(z.enum(['naesin', 'voca'])).nullish(),
});

export const studentBulkImportSchema = z.object({
  students: z.array(z.object({
    full_name: z.string().min(1).max(100),
    email: z.string().email().max(200),
    phone: z.string().max(20).nullish(),
  })).min(1).max(100),
  services: z.array(z.enum(['naesin', 'voca'])).nullish(),
});

export const studentBulkAssignSchema = z.object({
  studentIds: z.array(ID).min(1).max(100),
  services: z.array(z.enum(['naesin', 'voca'])).min(1),
  action: z.enum(['assign', 'revoke']),
});

// ── 홈페이지 관리 (Public Pages CRUD) Schemas ──

export const consultationPatchSchema = z.object({
  id: ID,
  status: z.enum(['new', 'contacted', 'enrolled', 'closed']).nullish(),
  memo: MEDIUM.nullish(),
});

export const faqCreateSchema = z.object({
  question: MEDIUM,
  answer: LONG,
  category: z.enum(['general', 'enrollment', 'payment', 'refund']).default('general'),
  display_order: z.number().nullish(),
  is_visible: z.boolean().nullish(),
});

export const faqPatchSchema = z.object({
  id: ID,
  question: MEDIUM.nullish(),
  answer: LONG.nullish(),
  category: z.enum(['general', 'enrollment', 'payment', 'refund']).nullish(),
  display_order: z.number().nullish(),
  is_visible: z.boolean().nullish(),
});

export const reviewCreateSchema = z.object({
  student_grade: SHORT,
  course_name: SHORT,
  content: LONG,
  achievement: SHORT.nullish(),
  display_order: z.number().nullish(),
  is_visible: z.boolean().nullish(),
});

export const reviewPatchSchema = z.object({
  id: ID,
  student_grade: SHORT.nullish(),
  course_name: SHORT.nullish(),
  content: LONG.nullish(),
  achievement: SHORT.nullish(),
  display_order: z.number().nullish(),
  is_visible: z.boolean().nullish(),
});

export const teacherProfileCreateSchema = z.object({
  display_name: SHORT,
  bio: LONG,
  image_url: URL_STR.nullish(),
  image_position: z.enum(['center', 'top', 'bottom']).nullish(),
  is_visible: z.boolean().nullish(),
  sort_order: z.number().nullish(),
});

export const teacherProfilePatchSchema = z.object({
  id: ID,
  display_name: SHORT.nullish(),
  bio: LONG.nullish(),
  image_url: URL_STR.nullish(),
  image_position: z.enum(['center', 'top', 'bottom']).nullish(),
  is_visible: z.boolean().nullish(),
  sort_order: z.number().nullish(),
});

export const courseCreateSchema = z.object({
  title: SHORT,
  category: z.enum(['grammar', 'school_exam', 'international', 'voca', 'reading']).default('grammar'),
  description: LONG.default(''),
  price: z.number().min(0),
  thumbnail_url: URL_STR.nullish(),
  detail_image_url: z.string().max(50000).nullish(),
  teacher_id: ID.nullish(),
  is_active: z.boolean().nullish(),
  sort_order: z.number().nullish(),
});

export const coursePatchSchema = z.object({
  id: ID,
  title: SHORT.nullish(),
  category: z.enum(['grammar', 'school_exam', 'international', 'voca', 'reading']).nullish(),
  description: LONG.nullish(),
  price: z.number().min(0).nullish(),
  thumbnail_url: URL_STR.nullish(),
  detail_image_url: z.string().max(50000).nullish(),
  teacher_id: ID.nullish(),
  is_active: z.boolean().nullish(),
  sort_order: z.number().nullish(),
});

// ── Auth Schemas ──

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(6),
});

// ── 업그레이드 결제 Schemas ──

export const upgradePlanSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().min(100),
  planId: z.string().uuid(),
});
