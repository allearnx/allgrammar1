-- 스펠링 오답 단어 저장
ALTER TABLE voca_student_progress
  ADD COLUMN IF NOT EXISTS spelling_wrong_words JSONB DEFAULT '[]';
