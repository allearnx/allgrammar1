-- 057: 독립 템플릿 저장소 (naesin_templates)
-- 기존 naesin_problem_sheets.is_template=true 방식에서
-- 별도 테이블로 분리하여 단원 삭제 시 템플릿이 함께 삭제되는 문제 해결

CREATE TABLE naesin_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  template_topic TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  answer_key JSONB NOT NULL DEFAULT '[]',
  category TEXT NOT NULL DEFAULT 'problem',
  mode TEXT NOT NULL DEFAULT 'interactive',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_naesin_templates_topic ON naesin_templates (template_topic);

-- RLS
ALTER TABLE naesin_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_templates" ON naesin_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "boss_manage_templates" ON naesin_templates FOR ALL
  USING (get_my_role() = 'boss')
  WITH CHECK (get_my_role() = 'boss');

-- 기존 is_template=true 데이터 마이그레이션
INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode, created_at)
SELECT title, COALESCE(template_topic, '기타'), questions, answer_key, category, mode, created_at
FROM naesin_problem_sheets
WHERE is_template = true;

-- source_template_id FK 제약조건 제거 (이제 naesin_templates.id도 참조 가능)
ALTER TABLE naesin_problem_sheets
  DROP CONSTRAINT IF EXISTS naesin_problem_sheets_source_template_id_fkey;
