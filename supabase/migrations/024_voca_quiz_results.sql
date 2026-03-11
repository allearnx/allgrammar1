-- 보카 퀴즈 결과 (틀린 단어 기록용)
CREATE TABLE voca_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES voca_days(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  wrong_words JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_voca_quiz_results_student ON voca_quiz_results(student_id);
CREATE INDEX idx_voca_quiz_results_day ON voca_quiz_results(day_id);
CREATE INDEX idx_voca_quiz_results_student_day ON voca_quiz_results(student_id, day_id);

ALTER TABLE voca_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_read_own_voca_quiz_results"
  ON voca_quiz_results FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "students_insert_own_voca_quiz_results"
  ON voca_quiz_results FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "staff_read_all_voca_quiz_results"
  ON voca_quiz_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('teacher', 'admin', 'boss')
    )
  );
