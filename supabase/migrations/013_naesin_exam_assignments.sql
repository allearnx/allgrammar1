-- 013_naesin_exam_assignments.sql
-- 시험 배정 시스템: 선생님이 학생별로 시험 회차 + 과를 유동적으로 배정

-- ============================================
-- naesin_exam_assignments: 학생별 시험 회차 배정
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_exam_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  textbook_id UUID NOT NULL REFERENCES naesin_textbooks(id) ON DELETE CASCADE,
  exam_round INTEGER NOT NULL,
  exam_label TEXT,
  exam_date DATE,
  unit_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, textbook_id, exam_round)
);

ALTER TABLE naesin_exam_assignments ENABLE ROW LEVEL SECURITY;

-- Students can read their own assignments
CREATE POLICY "Students can read own exam assignments"
  ON naesin_exam_assignments FOR SELECT
  USING (student_id = auth.uid());

-- Teachers/admin/boss can manage all assignments
CREATE POLICY "Teachers can manage exam assignments"
  ON naesin_exam_assignments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_naesin_exam_assignments_student_textbook
  ON naesin_exam_assignments(student_id, textbook_id);
