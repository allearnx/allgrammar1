-- 교과서 레벨 시험 대비: naesin_problem_sheets에 textbook_id 추가
-- unit_id를 nullable로 변경하여 교과서 레벨 시험 지원

-- 1) textbook_id 컬럼 추가
ALTER TABLE naesin_problem_sheets
  ADD COLUMN textbook_id UUID REFERENCES naesin_textbooks(id);

-- 2) unit_id를 nullable로 변경
ALTER TABLE naesin_problem_sheets
  ALTER COLUMN unit_id DROP NOT NULL;

-- 3) 인덱스
CREATE INDEX idx_problem_sheets_textbook ON naesin_problem_sheets(textbook_id)
  WHERE textbook_id IS NOT NULL;

-- 4) 검증: 둘 중 하나는 반드시 있어야 함
ALTER TABLE naesin_problem_sheets
  ADD CONSTRAINT chk_unit_or_textbook
  CHECK (unit_id IS NOT NULL OR textbook_id IS NOT NULL);

-- 5) naesin_wrong_answers의 unit_id도 nullable로
ALTER TABLE naesin_wrong_answers
  ALTER COLUMN unit_id DROP NOT NULL;
