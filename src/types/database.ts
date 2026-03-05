export type UserRole = 'student' | 'teacher' | 'admin' | 'boss';

export type MemoryItemType = 'vocabulary' | 'sentence' | 'grammar_rule';

export interface Academy {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  academy_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Level {
  id: string;
  level_number: number;
  title: string;
  title_ko: string;
  description: string | null;
  created_at: string;
}

export interface Grammar {
  id: string;
  level_id: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  youtube_video_id: string | null;
  video_duration_seconds: number | null;
  sort_order: number;
  created_at: string;
}

export interface MemoryItem {
  id: string;
  grammar_id: string;
  item_type: MemoryItemType;
  front_text: string;
  back_text: string;
  quiz_options: string[] | null;
  quiz_correct_index: number | null;
  spelling_hint: string | null;
  spelling_answer: string | null;
  sort_order: number;
  created_at: string;
}

export interface StudentMemoryProgress {
  id: string;
  student_id: string;
  memory_item_id: string;
  repetition_count: number;
  current_interval_days: number;
  next_review_date: string;
  flashcard_seen: boolean;
  quiz_correct_count: number;
  quiz_wrong_count: number;
  spelling_correct_count: number;
  spelling_wrong_count: number;
  is_mastered: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentProgress {
  id: string;
  student_id: string;
  grammar_id: string;
  video_watched_seconds: number;
  video_completed: boolean;
  video_last_position: number;
  created_at: string;
  updated_at: string;
}

export interface BlankItem {
  index: number;
  answer: string;
}

export interface SentenceItem {
  original: string;
  korean: string;
  words: string[];
}

export interface TextbookPassage {
  id: string;
  grammar_id: string;
  title: string;
  original_text: string;
  korean_translation: string;
  blanks_easy: BlankItem[] | null;
  blanks_medium: BlankItem[] | null;
  blanks_hard: BlankItem[] | null;
  sentences: SentenceItem[] | null;
  is_textbook_mode_active: boolean;
  created_at: string;
}

export interface StudentTextbookProgress {
  id: string;
  student_id: string;
  passage_id: string;
  fill_blanks_easy_score: number | null;
  fill_blanks_medium_score: number | null;
  fill_blanks_hard_score: number | null;
  fill_blanks_attempts: number;
  ordering_score: number | null;
  ordering_attempts: number;
  translation_score: number | null;
  translation_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  academy_id: string;
  title: string;
  created_by: string;
  created_at: string;
}

export interface StudentSettings {
  student_id: string;
  daily_review_limit: number;
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  created_at: string;
  updated_at: string;
}

// ============================================
// 내신 대비 시스템
// ============================================

export interface NaesinTextbook {
  id: string;
  grade: number;
  publisher: string;
  display_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface NaesinUnit {
  id: string;
  textbook_id: string;
  unit_number: number;
  title: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface NaesinVocabulary {
  id: string;
  unit_id: string;
  front_text: string;
  back_text: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  synonyms: string | null;
  antonyms: string | null;
  quiz_options: string[] | null;
  quiz_correct_index: number | null;
  spelling_hint: string | null;
  spelling_answer: string | null;
  sort_order: number;
  created_at: string;
}

export interface NaesinPassage {
  id: string;
  unit_id: string;
  title: string;
  original_text: string;
  korean_translation: string;
  blanks_easy: BlankItem[] | null;
  blanks_medium: BlankItem[] | null;
  blanks_hard: BlankItem[] | null;
  sentences: SentenceItem[] | null;
  sort_order: number;
  created_at: string;
}

export type NaesinGrammarContentType = 'video' | 'text';

export interface NaesinGrammarLesson {
  id: string;
  unit_id: string;
  title: string;
  content_type: NaesinGrammarContentType;
  youtube_url: string | null;
  youtube_video_id: string | null;
  video_duration_seconds: number | null;
  text_content: string | null;
  sort_order: number;
  created_at: string;
}

/** @deprecated OMR은 문제풀이(problem)로 대체됨. 히스토리용으로 유지 */
export interface NaesinOmrSheet {
  id: string;
  unit_id: string;
  title: string;
  total_questions: number;
  answer_key: number[];
  points_per_question: number[] | null;
  sort_order: number;
  created_at: string;
}

export interface NaesinStudentSettings {
  id: string;
  student_id: string;
  textbook_id: string;
  created_at: string;
  updated_at: string;
}

export interface NaesinStudentProgress {
  id: string;
  student_id: string;
  unit_id: string;
  vocab_flashcard_count: number;
  vocab_quiz_score: number | null;
  vocab_spelling_score: number | null;
  vocab_completed: boolean;
  passage_fill_blanks_best: number | null;
  passage_ordering_best: number | null;
  passage_completed: boolean;
  grammar_video_completed: boolean;
  grammar_text_read: boolean;
  grammar_completed: boolean;
  omr_completed: boolean;
  // New columns for flow overhaul
  vocab_quiz_sets_completed: number;
  vocab_total_quiz_sets: number;
  passage_translation_best: number | null;
  grammar_videos_completed: number;
  grammar_total_videos: number;
  problem_completed: boolean;
  last_review_unlocked: boolean;
  created_at: string;
  updated_at: string;
}

/** @deprecated OMR은 문제풀이(problem)로 대체됨. 히스토리용으로 유지 */
export interface NaesinOmrAttempt {
  id: string;
  student_id: string;
  omr_sheet_id: string;
  student_answers: number[];
  correct_count: number;
  total_questions: number;
  score_percent: number;
  created_at: string;
}

export interface NaesinVocabQuizResult {
  id: string;
  student_id: string;
  unit_id: string;
  attempt_number: number;
  score: number;
  total_questions: number;
  correct_count: number;
  wrong_words: { front_text: string; back_text: string }[];
  created_at: string;
}

export type NaesinStageStatus = 'locked' | 'available' | 'completed';

export interface NaesinStageStatuses {
  vocab: NaesinStageStatus;
  passage: NaesinStageStatus;
  grammar: NaesinStageStatus;
  problem: NaesinStageStatus;
  lastReview: NaesinStageStatus;
  /** @deprecated kept for backward compatibility */
  omr?: NaesinStageStatus;
}

export interface NaesinContentAvailability {
  hasVocab: boolean;
  hasPassage: boolean;
  hasGrammar: boolean;
  hasProblem: boolean;
  hasLastReview: boolean;
  /** @deprecated */
  hasOmr?: boolean;
}

// ============================================
// 내신 대비 신규 테이블 인터페이스 (Flow Overhaul)
// ============================================

export interface NaesinExamDate {
  id: string;
  student_id: string;
  textbook_id: string;
  exam_date: string;
  created_at: string;
  updated_at: string;
}

export interface NaesinVocabQuizSet {
  id: string;
  unit_id: string;
  title: string;
  set_order: number;
  vocab_ids: string[];
  created_at: string;
}

export interface NaesinVocabQuizSetResult {
  id: string;
  student_id: string;
  quiz_set_id: string;
  score: number;
  wrong_words: { front_text: string; back_text: string }[];
  created_at: string;
}

export interface NaesinGrammarVideoProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  watch_percent: number;
  max_position_reached: number;
  duration: number;
  cumulative_watch_seconds: number;
  last_position: number;
  completed: boolean;
  updated_at: string;
}

export type NaesinProblemMode = 'interactive' | 'image_answer';
export type NaesinProblemCategory = 'problem' | 'last_review';

export interface NaesinProblemSheet {
  id: string;
  unit_id: string;
  title: string;
  mode: NaesinProblemMode;
  questions: NaesinProblemQuestion[];
  pdf_url: string | null;
  answer_key: (string | number)[];
  sort_order: number;
  category: NaesinProblemCategory;
  created_at: string;
}

export interface NaesinProblemQuestion {
  number: number;
  question: string;
  options?: string[];
  answer: string | number;
  explanation?: string;
}

export interface NaesinProblemAttempt {
  id: string;
  student_id: string;
  sheet_id: string;
  answers: (string | number)[];
  score: number;
  total_questions: number;
  wrong_answers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[];
  created_at: string;
}

export type NaesinWrongAnswerStage = 'vocab' | 'passage' | 'grammar' | 'problem' | 'lastReview';

export interface NaesinWrongAnswer {
  id: string;
  student_id: string;
  unit_id: string;
  stage: NaesinWrongAnswerStage;
  source_type: string;
  question_data: Record<string, unknown>;
  resolved: boolean;
  created_at: string;
}

export type NaesinSimilarProblemStatus = 'pending' | 'approved' | 'rejected';

export interface NaesinSimilarProblem {
  id: string;
  unit_id: string;
  wrong_answer_id: string | null;
  grammar_tag: string | null;
  question_data: NaesinProblemQuestion;
  status: NaesinSimilarProblemStatus;
  created_by: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export type NaesinLastReviewContentType = 'video' | 'pdf' | 'text';

export interface NaesinLastReviewContent {
  id: string;
  unit_id: string;
  content_type: NaesinLastReviewContentType;
  title: string;
  youtube_url: string | null;
  youtube_video_id: string | null;
  pdf_url: string | null;
  text_content: string | null;
  sort_order: number;
  created_at: string;
}

// Extended types with relations
export interface GrammarWithLevel extends Grammar {
  level: Level;
}

export interface LevelWithGrammars extends Level {
  grammars: Grammar[];
}

export interface LevelWithProgress extends Level {
  grammars: Grammar[];
  completed_count: number;
  total_count: number;
}

export interface MemoryItemWithProgress extends MemoryItem {
  progress: StudentMemoryProgress | null;
}

export interface StudentWithProgress extends User {
  progress_summary: {
    total_videos: number;
    completed_videos: number;
    total_memory_items: number;
    mastered_memory_items: number;
    due_reviews: number;
  };
}
