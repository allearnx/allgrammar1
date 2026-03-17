-- 015_workbook_omr.sql
-- 교재 OMR 기능: 내신 문제집(마더텅, 100발100중 등) OMR 채점

-- ① 교재 마스터
CREATE TABLE IF NOT EXISTS naesin_workbooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  publisher   TEXT NOT NULL DEFAULT '',
  grade       INT NOT NULL DEFAULT 1,
  cover_image_url TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE naesin_workbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workbooks_select_all" ON naesin_workbooks
  FOR SELECT USING (true);

CREATE POLICY "workbooks_manage_teacher" ON naesin_workbooks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher','admin','boss'))
  );

-- ② 교재별 OMR 시트 (정답지)
CREATE TABLE IF NOT EXISTS naesin_workbook_omr_sheets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workbook_id     UUID NOT NULL REFERENCES naesin_workbooks(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  total_questions INT NOT NULL,
  answer_key      INTEGER[] NOT NULL,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workbook_omr_sheets_workbook ON naesin_workbook_omr_sheets(workbook_id);

ALTER TABLE naesin_workbook_omr_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "omr_sheets_select_all" ON naesin_workbook_omr_sheets
  FOR SELECT USING (true);

CREATE POLICY "omr_sheets_manage_teacher" ON naesin_workbook_omr_sheets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher','admin','boss'))
  );

-- ③ 학생 OMR 제출 기록
CREATE TABLE IF NOT EXISTS naesin_workbook_omr_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  omr_sheet_id    UUID NOT NULL REFERENCES naesin_workbook_omr_sheets(id) ON DELETE CASCADE,
  student_answers INTEGER[] NOT NULL,
  correct_count   INT NOT NULL,
  total_questions INT NOT NULL,
  score_percent   NUMERIC(5,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workbook_omr_attempts_student ON naesin_workbook_omr_attempts(student_id);
CREATE INDEX idx_workbook_omr_attempts_sheet ON naesin_workbook_omr_attempts(omr_sheet_id);

ALTER TABLE naesin_workbook_omr_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "omr_attempts_student_own" ON naesin_workbook_omr_attempts
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "omr_attempts_teacher_select" ON naesin_workbook_omr_attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher','admin','boss'))
  );
