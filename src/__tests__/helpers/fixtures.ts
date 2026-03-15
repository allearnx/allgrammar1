import type { AuthUser } from '@/types/auth';

// ── Users ──

export const testStudent: AuthUser = {
  id: 'student-1',
  email: 'student@test.com',
  full_name: '김학생',
  role: 'student',
  academy_id: 'academy-1',
};

export const testTeacher: AuthUser = {
  id: 'teacher-1',
  email: 'teacher@test.com',
  full_name: '이선생',
  role: 'teacher',
  academy_id: 'academy-1',
};

export const testAdmin: AuthUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  full_name: '박관리',
  role: 'admin',
  academy_id: 'academy-1',
};

export const testBoss: AuthUser = {
  id: 'boss-1',
  email: 'boss@test.com',
  full_name: 'Boss',
  role: 'boss',
  academy_id: null,
};

// ── Academy ──

export const testAcademy = {
  id: 'academy-1',
  name: '테스트학원',
  invite_code: 'ABC123',
  created_at: '2026-01-01T00:00:00Z',
};

// ── Textbook ──

export const testTextbook = {
  id: 'textbook-1',
  grade: '중1',
  publisher: '동아',
  display_name: '동아 중1',
  sort_order: 0,
};

// ── Unit ──

export const testUnit = {
  id: 'unit-1',
  textbook_id: 'textbook-1',
  unit_number: 1,
  title: 'Lesson 1',
  sort_order: 0,
};

// ── Passage ──

export const testPassage = {
  id: 'passage-1',
  unit_id: 'unit-1',
  title: 'Test Passage',
  original_text: 'Hello world. This is a test.',
  korean_translation: '안녕 세계. 이것은 테스트입니다.',
  sort_order: 0,
};

// ── Vocabulary ──

export const testVocab = {
  id: 'vocab-1',
  unit_id: 'unit-1',
  front_text: 'apple',
  back_text: '사과',
  part_of_speech: 'noun',
  example_sentence: 'I like apples.',
  sort_order: 0,
};

// ── Voca Book / Day ──

export const testVocaBook = {
  id: 'book-1',
  title: 'Test Book',
  description: 'A test vocab book',
  sort_order: 0,
};

export const testVocaDay = {
  id: 'day-1',
  book_id: 'book-1',
  day_number: 1,
  title: 'Day 1',
  sort_order: 0,
};

// ── Grammar Lesson ──

export const testGrammarLesson = {
  id: 'lesson-1',
  unit_id: 'unit-1',
  title: 'Present Tense',
  content_type: 'video',
  youtube_url: 'https://youtube.com/watch?v=test',
  youtube_video_id: 'test',
  sort_order: 0,
};

// ── Service Assignment ──

export const testServiceAssignment = {
  id: 'sa-1',
  student_id: 'student-1',
  service: 'naesin' as const,
  assigned_by: 'admin-1',
};

// ── Progress ──

export const testNaesinProgress = {
  id: 'progress-1',
  student_id: 'student-1',
  unit_id: 'unit-1',
  vocab_quiz_score: 0,
  vocab_spelling_score: 0,
  vocab_completed: false,
  grammar_video_completed: false,
  grammar_text_read: false,
  grammar_completed: false,
  passage_fill_blanks_best: 0,
  passage_ordering_best: 0,
  passage_translation_best: 0,
  passage_grammar_vocab_best: 0,
  passage_completed: false,
};
