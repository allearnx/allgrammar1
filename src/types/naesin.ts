import type { BlankItem, SentenceItem } from './textbook';

// ============================================
// 어법/어휘 선택 문제
// ============================================

export interface GrammarVocabChoicePoint {
  startWord: number;   // 문장 내 단어 시작 인덱스
  endWord: number;     // 문장 내 단어 끝 인덱스
  options: string[];   // 2~3개 선택지
  correctIndex: number; // 정답 인덱스
}

export interface GrammarVocabItem {
  sentenceIndex: number;
  original: string;
  korean: string;
  choicePoints: GrammarVocabChoicePoint[];
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
  grammar_vocab_items: GrammarVocabItem[] | null;
  pdf_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface NaesinDialogueSentence {
  original: string;
  korean: string;
  speaker?: string;
}

export interface NaesinDialogue {
  id: string;
  unit_id: string;
  title: string;
  sentences: NaesinDialogueSentence[];
  sort_order: number;
  created_at: string;
}

export interface NaesinTextbookVideo {
  id: string;
  unit_id: string;
  title: string;
  youtube_url: string | null;
  youtube_video_id: string | null;
  video_duration_seconds: number | null;
  sort_order: number;
  created_at: string;
}

export interface NaesinTextbookVideoProgress {
  id: string;
  student_id: string;
  video_id: string;
  watch_percent: number;
  max_position_reached: number;
  duration: number;
  cumulative_watch_seconds: number;
  last_position: number;
  completed: boolean;
  updated_at: string;
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
  enabled_stages?: string[];
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
  passage_grammar_vocab_best: number | null;
  dialogue_translation_best: number | null;
  dialogue_completed: boolean;
  // Round 2 columns
  round2_passage_fill_blanks_best: number | null;
  round2_passage_ordering_best: number | null;
  round2_passage_translation_best: number | null;
  round2_passage_grammar_vocab_best: number | null;
  round2_passage_completed: boolean;
  round2_dialogue_translation_best: number | null;
  round2_dialogue_completed: boolean;
  grammar_videos_completed: number;
  grammar_total_videos: number;
  problem_completed: boolean;
  last_review_unlocked: boolean;
  textbook_video_completed: boolean;
  textbook_videos_completed: number;
  textbook_total_videos: number;
  mock_exam_completed: boolean;
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

export type NaesinStageStatus = 'locked' | 'available' | 'completed' | 'hidden';

export interface NaesinStageStatuses {
  vocab: NaesinStageStatus;
  passage: NaesinStageStatus;
  dialogue: NaesinStageStatus;
  textbookVideo: NaesinStageStatus;
  grammar: NaesinStageStatus;
  problem: NaesinStageStatus;
  mockExam: NaesinStageStatus;
  lastReview: NaesinStageStatus;
  /** @deprecated kept for backward compatibility */
  omr?: NaesinStageStatus;
}

export interface NaesinContentAvailability {
  hasVocab: boolean;
  hasPassage: boolean;
  hasDialogue: boolean;
  hasTextbookVideo: boolean;
  hasGrammar: boolean;
  hasProblem: boolean;
  hasMockExam: boolean;
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
export type NaesinProblemCategory = 'problem' | 'last_review' | 'mock_exam';

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

export type RejectionReason =
  | 'wrong_answer'
  | 'grammar_error'
  | 'too_easy'
  | 'too_hard'
  | 'ambiguous'
  | 'duplicate'
  | 'other';

export interface NaesinSimilarProblem {
  id: string;
  unit_id: string;
  wrong_answer_id: string | null;
  grammar_tag: string | null;
  question_data: NaesinProblemQuestion;
  status: NaesinSimilarProblemStatus;
  quality_score: number | null;
  rejection_reason: RejectionReason | null;
  validation_result: Record<string, unknown> | null;
  created_by: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NaesinExamAssignment {
  id: string;
  student_id: string;
  textbook_id: string;
  exam_round: number;
  exam_label: string | null;
  exam_date: string | null;
  unit_ids: string[];
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

// ============================================
// 소크라틱 AI 문법 챗봇
// ============================================

export interface NaesinGrammarChatQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  grammar_concept: string | null;
  hint: string | null;
  expected_answer_keywords: string[];
  sort_order: number;
  created_at: string;
}

// ============================================
// 교재 OMR (독립 기능)
// ============================================

export interface NaesinWorkbook {
  id: string;
  title: string;
  publisher: string;
  grade: number;
  cover_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface NaesinWorkbookOmrSheet {
  id: string;
  workbook_id: string;
  title: string;
  total_questions: number;
  answer_key: number[];
  created_by: string | null;
  sort_order: number;
  created_at: string;
}

export interface NaesinWorkbookOmrAttempt {
  id: string;
  student_id: string;
  omr_sheet_id: string;
  student_answers: number[];
  correct_count: number;
  total_questions: number;
  score_percent: number;
  created_at: string;
}

export type NaesinGrammarChatMessageRole = 'ai' | 'student';

export interface NaesinGrammarChatMessage {
  role: NaesinGrammarChatMessageRole;
  content: string;
  questionId?: string;
  feedback?: {
    isCorrect: boolean;
    correctedPoint: string | null;
  };
  timestamp: string;
}

export interface NaesinGrammarChatSession {
  id: string;
  student_id: string;
  lesson_id: string;
  messages: NaesinGrammarChatMessage[];
  turn_count: number;
  max_turns: number;
  is_complete: boolean;
  current_question_id: string | null;
  questions_used: string[];
  created_at: string;
  updated_at: string;
}
