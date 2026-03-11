// ============================================
// 올킬보카 시스템
// ============================================

export interface VocaBook {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface VocaDay {
  id: string;
  book_id: string;
  day_number: number;
  title: string;
  sort_order: number;
  created_at: string;
}

export interface VocaIdiom {
  en: string;
  ko: string;
  example_en?: string;
  example_ko?: string;
}

export interface VocaVocabulary {
  id: string;
  day_id: string;
  front_text: string;
  back_text: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  synonyms: string | null;
  antonyms: string | null;
  spelling_hint: string | null;
  spelling_answer: string | null;
  idioms: VocaIdiom[] | null;
  sort_order: number;
  created_at: string;
}

export interface VocaStudentProgress {
  id: string;
  student_id: string;
  day_id: string;
  flashcard_completed: boolean;
  quiz_score: number | null;
  spelling_score: number | null;
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

export type VocaMatchingSubmissionStatus = 'pending' | 'reviewed';

export interface VocaMatchingSubmission {
  id: string;
  student_id: string;
  day_id: string;
  wrong_words: { word: string; match: string; type: 'synonym' | 'antonym' }[];
  writings: { word: string; attempts: string[] }[];
  status: VocaMatchingSubmissionStatus;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 서비스 배정
// ============================================

export type ServiceType = 'naesin' | 'voca';

export interface ServiceAssignment {
  id: string;
  student_id: string;
  service: ServiceType;
  assigned_by: string;
  created_at: string;
}
