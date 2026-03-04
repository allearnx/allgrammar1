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
  created_at: string;
  updated_at: string;
}

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

export type NaesinStageStatus = 'locked' | 'available' | 'completed';

export interface NaesinStageStatuses {
  vocab: NaesinStageStatus;
  passage: NaesinStageStatus;
  grammar: NaesinStageStatus;
  omr: NaesinStageStatus;
}

export interface NaesinContentAvailability {
  hasVocab: boolean;
  hasPassage: boolean;
  hasGrammar: boolean;
  hasOmr: boolean;
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
