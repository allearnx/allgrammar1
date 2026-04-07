-- naesin_problem_sheets category CHECK: grammar 추가
ALTER TABLE naesin_problem_sheets
DROP CONSTRAINT IF EXISTS naesin_problem_sheets_category_check;

ALTER TABLE naesin_problem_sheets
ADD CONSTRAINT naesin_problem_sheets_category_check
CHECK (category IN ('problem', 'last_review', 'mock_exam', 'grammar'));
