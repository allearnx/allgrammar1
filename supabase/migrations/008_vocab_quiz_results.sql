-- 단어 퀴즈 결과 기록 테이블
CREATE TABLE IF NOT EXISTS naesin_vocab_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  wrong_words JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_vocab_quiz_results_student ON naesin_vocab_quiz_results(student_id);
CREATE INDEX idx_vocab_quiz_results_unit ON naesin_vocab_quiz_results(unit_id);
CREATE INDEX idx_vocab_quiz_results_student_unit ON naesin_vocab_quiz_results(student_id, unit_id);

-- RLS
ALTER TABLE naesin_vocab_quiz_results ENABLE ROW LEVEL SECURITY;

-- 학생 본인 결과 조회/삽입
CREATE POLICY "Students can view own quiz results"
  ON naesin_vocab_quiz_results FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own quiz results"
  ON naesin_vocab_quiz_results FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- 선생님/관리자 조회
CREATE POLICY "Teachers and admins can view all quiz results"
  ON naesin_vocab_quiz_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('teacher', 'admin', 'boss')
    )
  );

