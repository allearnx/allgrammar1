-- 054: 문제 템플릿 라이브러리
-- Boss가 만든 고품질 문제 세트를 선생님들이 발견하고 가져올 수 있도록

ALTER TABLE naesin_problem_sheets
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_topic TEXT;

CREATE INDEX IF NOT EXISTS idx_problem_sheets_template
  ON naesin_problem_sheets (is_template)
  WHERE is_template = true;
