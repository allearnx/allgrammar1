-- "내신 콕콕" (2026-09-17 사장님): 내신 문제에서 특정 문법 유형을 틀리는 학생에게 주는 맞춤 세트.
-- 내신 단원 문항과 별개의 문항으로 만들고, 콘텐츠 관리(레벨→문법 주제) 아래에서 보관·배정·관리한다.
-- naesin_templates에 kind('template' 일반 템플릿 / 'kokkok' 내신 콕콕)와 grammar_id(콘텐츠 관리 문법 주제) 추가.
-- 템플릿 라이브러리 목록은 kind='template'만, 콘텐츠 관리는 kind='kokkok'만 보여준다. idempotent.

ALTER TABLE naesin_templates ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'template';
ALTER TABLE naesin_templates DROP CONSTRAINT IF EXISTS naesin_templates_kind_check;
ALTER TABLE naesin_templates ADD CONSTRAINT naesin_templates_kind_check CHECK (kind IN ('template', 'kokkok'));

ALTER TABLE naesin_templates ADD COLUMN IF NOT EXISTS grammar_id UUID REFERENCES grammars(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_naesin_templates_kind ON naesin_templates (kind);
CREATE INDEX IF NOT EXISTS idx_naesin_templates_grammar ON naesin_templates (grammar_id) WHERE grammar_id IS NOT NULL;
