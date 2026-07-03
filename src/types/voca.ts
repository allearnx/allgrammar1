// ============================================
// 올킬보카 시스템
// ============================================

export interface VocaBook {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface VocaDay {
  id: string;
  book_id: string;
  day_number: number;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface VocaIdiom {
  en: string;
  ko: string;
  example_en?: string;
  example_ko?: string;
}

/** 단어별 타임스탬프 (ElevenLabs TTS 동기화) */
export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface VocaVocabulary {
  id: string;
  day_id: string;
  front_text: string;
  back_text: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  example_sentence_ko: string | null;
  synonyms: string | null;
  antonyms: string | null;
  spelling_hint: string | null;
  spelling_answer: string | null;
  idioms: VocaIdiom[] | null;
  sort_order: number;
  created_at: string;
  audio_url: string | null;
  word_timestamps: WordTimestamp[] | null;
  exam_source: string | null;
}

export interface VocaStudentProgress {
  id: string;
  student_id: string;
  day_id: string;
  flashcard_completed: boolean;
  quiz_score: number | null;
  spelling_score: number | null;
  exam_score: number | null;
  matching_score: number | null;
  matching_attempt: number;
  matching_completed: boolean;
  round2_flashcard_completed: boolean;
  round2_quiz_score: number | null;
  round2_matching_score: number | null;
  round2_matching_attempt: number;
  round2_matching_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const EMPTY_VOCA_PROGRESS: VocaStudentProgress = {
  id: '',
  student_id: '',
  day_id: '',
  flashcard_completed: false,
  quiz_score: null,
  spelling_score: null,
  exam_score: null,
  matching_score: null,
  matching_attempt: 0,
  matching_completed: false,
  round2_flashcard_completed: false,
  round2_quiz_score: null,
  round2_matching_score: null,
  round2_matching_attempt: 0,
  round2_matching_completed: false,
  created_at: '',
  updated_at: '',
};

export type VocaWrongWordType = 'synonym' | 'antonym' | 'sentence';

export interface VocaWrongWord {
  word: string;
  match: string;
  type: VocaWrongWordType;
}

export type VocaMatchingSubmissionStatus = 'pending' | 'reviewed';

export interface VocaMatchingSubmission {
  id: string;
  student_id: string;
  day_id: string;
  wrong_words: VocaWrongWord[];
  writings: { word: string; attempts: string[] }[];
  status: VocaMatchingSubmissionStatus;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 서비스 배정
// ============================================

/** Supabase JOIN shape: voca_student_progress + voca_days + voca_books */
export interface VocaProgressRow {
  day_id: string;
  flashcard_completed: boolean;
  quiz_score: number | null;
  spelling_score: number | null;
  matching_score: number | null;
  matching_completed: boolean;
  round2_flashcard_completed: boolean;
  round2_quiz_score: number | null;
  round2_matching_score: number | null;
  round2_matching_completed: boolean;
  updated_at: string;
  day: {
    id: string;
    day_number: number;
    title: string;
    book: { id: string; title: string; sort_order: number } | null;
  } | null;
}

// ============================================
// 서비스 배정
// ============================================

// ── 컬럼 상수 (select('*') → 명시적 컬럼) ──

export const VOCA_BOOKS_COLUMNS = 'id, title, description, cover_image_url, sort_order, is_active, created_at';

export const VOCA_DAYS_COLUMNS = 'id, book_id, day_number, title, sort_order, created_at, description';

export const VOCA_VOCABULARY_COLUMNS = 'id, day_id, front_text, back_text, part_of_speech, example_sentence, synonyms, antonyms, spelling_hint, spelling_answer, sort_order, created_at, idioms, example_sentence_ko, audio_url, word_timestamps, exam_source';

export const VOCA_STUDENT_PROGRESS_COLUMNS = 'id, student_id, day_id, flashcard_completed, quiz_score, spelling_score, exam_score, matching_score, matching_attempt, matching_completed, created_at, updated_at, round2_flashcard_completed, round2_quiz_score, round2_matching_score, round2_matching_attempt, round2_matching_completed';

export type ServiceType = 'naesin' | 'voca';

export interface ServiceAssignment {
  id: string;
  student_id: string;
  service: ServiceType;
  assigned_by: string;
  created_at: string;
}
