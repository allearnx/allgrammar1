-- 056: 문제풀이 중간 저장 (Server-side Draft)
-- 학생이 문제를 풀다가 중간에 저장하고, 다른 기기에서 이어풀기 가능

CREATE TABLE naesin_problem_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sheet_id UUID NOT NULL REFERENCES naesin_problem_sheets(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES naesin_units(id) ON DELETE SET NULL,
  draft_data JSONB NOT NULL,
  answered_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, sheet_id)
);

CREATE INDEX idx_problem_drafts_student_sheet
  ON naesin_problem_drafts (student_id, sheet_id);

ALTER TABLE naesin_problem_drafts ENABLE ROW LEVEL SECURITY;

-- 학생 본인 CRUD
CREATE POLICY "Problem drafts: own data" ON naesin_problem_drafts
  FOR ALL USING (student_id = auth.uid());

-- 선생님/관리자/boss 읽기
CREATE POLICY "Problem drafts: teacher read" ON naesin_problem_drafts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
        AND u.role IN ('teacher', 'admin', 'boss')
    )
  );
