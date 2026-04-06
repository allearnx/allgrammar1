-- 대화문 암기 강화: 순서 배열 + 첫 글자 힌트 점수 컬럼 추가
ALTER TABLE naesin_student_progress
  ADD COLUMN IF NOT EXISTS dialogue_ordering_best INTEGER,
  ADD COLUMN IF NOT EXISTS dialogue_first_letter_best INTEGER,
  ADD COLUMN IF NOT EXISTS round2_dialogue_ordering_best INTEGER,
  ADD COLUMN IF NOT EXISTS round2_dialogue_first_letter_best INTEGER;
