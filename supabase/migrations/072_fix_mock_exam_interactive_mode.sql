-- 기존에 AddMockExamDialog 기본값이 'interactive'였지만 questions 없이 생성된
-- mock_exam 시트들을 image_answer로 변경 (학생이 "문제가 없습니다" 보는 버그 수정)
UPDATE naesin_problem_sheets
SET mode = 'image_answer'
WHERE category = 'mock_exam'
  AND mode = 'interactive'
  AND (questions IS NULL OR questions = '[]'::jsonb);
