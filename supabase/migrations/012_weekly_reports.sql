-- ============================================
-- 012: 주간 리포트 저장
-- ============================================

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES users(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, week_start)
);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- 학생 본인 읽기
CREATE POLICY "students_read_own_reports"
  ON weekly_reports FOR SELECT
  USING (student_id = auth.uid());

-- 같은 학원 teacher 읽기
CREATE POLICY "teachers_read_academy_reports"
  ON weekly_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users t
      JOIN users s ON s.academy_id = t.academy_id
      WHERE t.id = auth.uid()
        AND t.role = 'teacher'
        AND s.id = weekly_reports.student_id
    )
  );

-- boss/admin 전체 읽기 + 쓰기
CREATE POLICY "boss_admin_manage_reports"
  ON weekly_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('boss', 'admin')
    )
  );

-- teacher INSERT/UPDATE
CREATE POLICY "teachers_write_reports"
  ON weekly_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "teachers_update_reports"
  ON weekly_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE INDEX idx_weekly_reports_student ON weekly_reports(student_id);
CREATE INDEX idx_weekly_reports_week ON weekly_reports(student_id, week_start);
