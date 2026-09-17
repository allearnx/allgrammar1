-- 073의 chk_unit_or_textbook(단원 또는 교과서 필수)이 학생 개별 배정(내신 콕콕, 110) 행을 막고 있었음.
-- 배정 행은 unit_id·textbook_id가 모두 null이고 assigned_student_id만 있으므로 제약에 포함한다.
-- 110의 naesin_problem_sheets_unit_or_assignee 와 중복 의미이므로 하나로 합친다. idempotent.
ALTER TABLE naesin_problem_sheets DROP CONSTRAINT IF EXISTS chk_unit_or_textbook;
ALTER TABLE naesin_problem_sheets DROP CONSTRAINT IF EXISTS naesin_problem_sheets_unit_or_assignee;
ALTER TABLE naesin_problem_sheets ADD CONSTRAINT chk_unit_or_textbook
  CHECK (unit_id IS NOT NULL OR textbook_id IS NOT NULL OR assigned_student_id IS NOT NULL);
