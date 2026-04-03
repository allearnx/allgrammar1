-- AI 오답 분석 리포트 테이블
CREATE TABLE IF NOT EXISTS naesin_ai_analyses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generated_by uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  analysis   jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 최신 1건 빠르게 조회
CREATE INDEX idx_ai_analyses_student_latest
  ON naesin_ai_analyses (student_id, created_at DESC);

-- RLS
ALTER TABLE naesin_ai_analyses ENABLE ROW LEVEL SECURITY;

-- 본인 학생 읽기
CREATE POLICY "ai_analyses_student_read" ON naesin_ai_analyses
  FOR SELECT USING (student_id = auth.uid());

-- 같은 학원 teacher/admin 읽기 + 쓰기
CREATE POLICY "ai_analyses_staff_all" ON naesin_ai_analyses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u1.academy_id = u2.academy_id
      WHERE u1.id = auth.uid()
        AND u1.role IN ('teacher', 'admin')
        AND u2.id = naesin_ai_analyses.student_id
    )
  );

-- boss 전체 접근
CREATE POLICY "ai_analyses_boss_all" ON naesin_ai_analyses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'boss')
  );
