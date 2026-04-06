-- Add 'dialogue' to allowed stages in naesin_wrong_answers
ALTER TABLE naesin_wrong_answers
  DROP CONSTRAINT naesin_wrong_answers_stage_check;

ALTER TABLE naesin_wrong_answers
  ADD CONSTRAINT naesin_wrong_answers_stage_check
  CHECK (stage IN ('vocab', 'passage', 'dialogue', 'grammar', 'problem', 'lastReview'));
