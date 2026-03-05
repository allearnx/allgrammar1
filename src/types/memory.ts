export type MemoryItemType = 'vocabulary' | 'sentence' | 'grammar_rule';

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

export interface MemoryItemWithProgress extends MemoryItem {
  progress: StudentMemoryProgress | null;
}
