-- 055: 템플릿 복사본 원본 추적
-- 복사된 문제 세트가 어떤 템플릿에서 파생되었는지 추적

ALTER TABLE naesin_problem_sheets
  ADD COLUMN IF NOT EXISTS source_template_id UUID REFERENCES naesin_problem_sheets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_problem_sheets_source_template
  ON naesin_problem_sheets (source_template_id)
  WHERE source_template_id IS NOT NULL;
