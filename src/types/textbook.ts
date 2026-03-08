export interface BlankItem {
  index: number;
  answer: string;
}

export interface SentenceItem {
  original: string;
  korean: string;
  words: string[];
  acceptedAnswers?: string[];
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
