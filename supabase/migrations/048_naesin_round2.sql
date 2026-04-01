-- academies 테이블에 2회독 설정 추가
ALTER TABLE academies
  ADD COLUMN IF NOT EXISTS naesin_required_rounds INTEGER NOT NULL DEFAULT 1;

-- naesin_student_progress에 round2 컬럼 추가
ALTER TABLE naesin_student_progress
  ADD COLUMN IF NOT EXISTS round2_passage_fill_blanks_best INTEGER,
  ADD COLUMN IF NOT EXISTS round2_passage_ordering_best INTEGER,
  ADD COLUMN IF NOT EXISTS round2_passage_translation_best INTEGER,
  ADD COLUMN IF NOT EXISTS round2_passage_grammar_vocab_best INTEGER,
  ADD COLUMN IF NOT EXISTS round2_passage_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS round2_dialogue_translation_best INTEGER,
  ADD COLUMN IF NOT EXISTS round2_dialogue_completed BOOLEAN NOT NULL DEFAULT false;
