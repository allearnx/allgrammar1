-- Add grammar/vocab exercise support to passage system

-- 1. Add grammar_vocab_items JSONB column to naesin_passages
ALTER TABLE naesin_passages
  ADD COLUMN IF NOT EXISTS grammar_vocab_items JSONB;

-- 2. Add best score column to naesin_student_progress
ALTER TABLE naesin_student_progress
  ADD COLUMN IF NOT EXISTS passage_grammar_vocab_best INTEGER;

-- 3. Update naesin_passage_attempts type CHECK to include grammar_vocab
ALTER TABLE naesin_passage_attempts
  DROP CONSTRAINT IF EXISTS naesin_passage_attempts_type_check;

ALTER TABLE naesin_passage_attempts
  ADD CONSTRAINT naesin_passage_attempts_type_check
  CHECK (type IN ('fill_blanks', 'ordering', 'translation', 'grammar_vocab'));
