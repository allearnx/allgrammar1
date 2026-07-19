-- ============================================
-- 097: 어휘 레벨 진단 결과
--   학년 선택 → 밴드별 10문항 스테어케이스 라운드 → 레벨 판정.
--   rounds JSONB: [{band, total, correct, unknown, items:[{vocabId, front_text, back_text, result}]}]
--   coverage_score = 1라운드(본인 학년 밴드) 정답률 — "○학년 단어 커버리지 N%" 헤드라인용.
--   재진단 시 rounds.items의 vocabId로 이전 출제 단어를 제외한다.
-- ============================================

CREATE TABLE IF NOT EXISTS voca_diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  start_band TEXT NOT NULL,
  final_band TEXT NOT NULL,
  final_qualifier TEXT NOT NULL DEFAULT 'exact' CHECK (final_qualifier IN ('exact', 'above', 'below')),
  coverage_score INTEGER NOT NULL CHECK (coverage_score >= 0 AND coverage_score <= 100),
  rounds JSONB NOT NULL DEFAULT '[]'::jsonb,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voca_diagnostic_results_student
  ON voca_diagnostic_results(student_id, created_at DESC);

ALTER TABLE voca_diagnostic_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_read_own_voca_diagnostic_results" ON voca_diagnostic_results;
CREATE POLICY "students_read_own_voca_diagnostic_results"
  ON voca_diagnostic_results FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "students_insert_own_voca_diagnostic_results" ON voca_diagnostic_results;
CREATE POLICY "students_insert_own_voca_diagnostic_results"
  ON voca_diagnostic_results FOR INSERT
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "staff_read_all_voca_diagnostic_results" ON voca_diagnostic_results;
CREATE POLICY "staff_read_all_voca_diagnostic_results"
  ON voca_diagnostic_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('teacher', 'admin', 'boss')
    )
  );

GRANT SELECT, INSERT ON voca_diagnostic_results TO authenticated;
