-- 교과서 단어 암기 PDF 등 교과서 자료 (2026-09-06)
--
-- 배경: 암기 PDF가 일반 학습자료(learning_materials, 평평한 목록)에만 올라갈 수 있어
-- 선생님은 올릴 곳을, 학생은 받을 곳을 못 찾음. 교과서(naesin_textbooks)에 직접 붙여
-- 관리 화면 교과서 목록(올린 사람·개수 표시 = 선생님 간 중복 업로드 방지)과
-- 학생 내신 홈(내 교과서의 자료만 다운로드)에 노출한다.
--
-- 쓰기: /api/naesin/textbook-materials (boss + can_manage_content 학원만, admin client)
-- 읽기: 학생·스태프 화면의 user-scoped select → SELECT 정책 authenticated 공개

CREATE TABLE IF NOT EXISTS naesin_textbook_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES naesin_textbooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_naesin_textbook_materials_textbook
  ON naesin_textbook_materials (textbook_id);

ALTER TABLE naesin_textbook_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS naesin_textbook_materials_read ON naesin_textbook_materials;
CREATE POLICY naesin_textbook_materials_read ON naesin_textbook_materials
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON naesin_textbook_materials TO authenticated;
GRANT ALL ON naesin_textbook_materials TO service_role;
