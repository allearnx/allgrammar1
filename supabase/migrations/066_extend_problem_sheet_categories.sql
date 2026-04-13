-- Extend naesin_problem_sheets category to support external_passage and eng_eng_def
ALTER TABLE naesin_problem_sheets
  DROP CONSTRAINT IF EXISTS naesin_problem_sheets_category_check;

ALTER TABLE naesin_problem_sheets
  ADD CONSTRAINT naesin_problem_sheets_category_check
  CHECK (category IN ('problem','last_review','mock_exam','grammar','external_passage','eng_eng_def'));

-- Also extend naesin_templates category if it has a check constraint
ALTER TABLE naesin_templates
  DROP CONSTRAINT IF EXISTS naesin_templates_category_check;

ALTER TABLE naesin_templates
  ADD CONSTRAINT naesin_templates_category_check
  CHECK (category IN ('problem','last_review','mock_exam','grammar','external_passage','eng_eng_def'));
