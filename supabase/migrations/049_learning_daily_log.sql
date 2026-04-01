-- 날짜별 학습 시간 기록 테이블
CREATE TABLE IF NOT EXISTS learning_daily_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  context_type TEXT NOT NULL CHECK (context_type IN ('naesin', 'voca')),
  seconds INTEGER NOT NULL DEFAULT 0,
  UNIQUE (student_id, date, context_type)
);

CREATE INDEX idx_learning_daily_log_student ON learning_daily_log(student_id, date);
ALTER TABLE learning_daily_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "학생 본인 조회" ON learning_daily_log FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "학생 본인 삽입" ON learning_daily_log FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "학생 본인 수정" ON learning_daily_log FOR UPDATE USING (auth.uid() = student_id);
