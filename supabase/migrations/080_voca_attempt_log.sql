-- 보카 학습 이력 로그 (재시험 포함 모든 시도 기록)
CREATE TABLE voca_attempt_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES voca_days(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('flashcard','quiz','spelling','matching')),
  score INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_voca_attempt_log_lookup ON voca_attempt_log(student_id, day_id, created_at);

ALTER TABLE voca_attempt_log ENABLE ROW LEVEL SECURITY;

-- 학생: 본인 데이터 조회
CREATE POLICY "voca_attempt_log_own" ON voca_attempt_log
  FOR SELECT USING (student_id = auth.uid());

-- 학생: 본인 INSERT
CREATE POLICY "voca_attempt_log_insert" ON voca_attempt_log
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- boss: 전체 조회
CREATE POLICY "voca_attempt_log_boss" ON voca_attempt_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'boss')
  );

-- teacher/admin: 같은 학원 학생만 조회
CREATE POLICY "voca_attempt_log_staff_academy" ON voca_attempt_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS staff
      JOIN users AS student ON student.id = voca_attempt_log.student_id
      WHERE staff.id = auth.uid()
        AND staff.role IN ('teacher', 'admin')
        AND staff.academy_id = student.academy_id
    )
  );
