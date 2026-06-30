-- ============================================
-- 091: 올킬보카 묶음 보너스 시험 결과 (v2)
--   여러 Day(1~3개)를 묶어 표제어 스펠링 시험을 본 결과. Day 조합(range_key)별로
--   매 응시 기록(attempt). 최고점·재응시 횟수는 range_key 기준으로 집계.
-- ============================================

CREATE TABLE IF NOT EXISTS voca_exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES voca_books(id) ON DELETE CASCADE,
  day_ids JSONB NOT NULL DEFAULT '[]'::jsonb,   -- 선택한 Day id 배열(정렬됨)
  range_key TEXT NOT NULL,                       -- 정렬된 day_id 조합 키 (최고점/재응시 집계용)
  attempt_number INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  wrong_words JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voca_exam_results_student ON voca_exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_voca_exam_results_student_range ON voca_exam_results(student_id, range_key);

ALTER TABLE voca_exam_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_read_own_voca_exam_results" ON voca_exam_results;
CREATE POLICY "students_read_own_voca_exam_results"
  ON voca_exam_results FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "students_insert_own_voca_exam_results" ON voca_exam_results;
CREATE POLICY "students_insert_own_voca_exam_results"
  ON voca_exam_results FOR INSERT
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "staff_read_all_voca_exam_results" ON voca_exam_results;
CREATE POLICY "staff_read_all_voca_exam_results"
  ON voca_exam_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('teacher', 'admin', 'boss')
    )
  );

GRANT SELECT, INSERT ON voca_exam_results TO authenticated;
