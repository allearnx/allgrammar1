-- ============================================
-- 092: 올킬보카 선생님 배정형 시험 (v3-B)
--   선생님/원장이 학생에게 "이 교재의 Day 묶음 표제어 스펠링 시험을 봐라" 배정.
--   학생은 배정된 시험을 응시. 결과는 voca_exam_results에 assignment_id로 연결.
-- ============================================

CREATE TABLE IF NOT EXISTS voca_exam_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES voca_books(id) ON DELETE CASCADE,
  day_ids JSONB NOT NULL DEFAULT '[]'::jsonb,   -- 배정한 Day id 배열(정렬됨)
  range_key TEXT NOT NULL,
  title TEXT,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voca_exam_assignments_student ON voca_exam_assignments(student_id);

ALTER TABLE voca_exam_assignments ENABLE ROW LEVEL SECURITY;

-- 학생 본인 배정 조회
DROP POLICY IF EXISTS "students_read_own_voca_exam_assignments" ON voca_exam_assignments;
CREATE POLICY "students_read_own_voca_exam_assignments"
  ON voca_exam_assignments FOR SELECT
  USING (student_id = auth.uid());

-- 스태프 조회 (생성/삭제는 서버의 admin 클라이언트로 수행 — 역할게이트 + 학원범위 검증 후)
DROP POLICY IF EXISTS "staff_read_all_voca_exam_assignments" ON voca_exam_assignments;
CREATE POLICY "staff_read_all_voca_exam_assignments"
  ON voca_exam_assignments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin', 'boss'))
  );

GRANT SELECT ON voca_exam_assignments TO authenticated;

-- 결과 ↔ 배정 연결 (셀프 시험은 NULL)
ALTER TABLE voca_exam_results
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES voca_exam_assignments(id) ON DELETE SET NULL;
