-- Record every passage exercise attempt (fill_blanks, ordering, translation)
CREATE TABLE IF NOT EXISTS naesin_passage_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fill_blanks', 'ordering', 'translation')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_passage_attempts_student ON naesin_passage_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_passage_attempts_unit ON naesin_passage_attempts(unit_id);
CREATE INDEX IF NOT EXISTS idx_passage_attempts_student_unit ON naesin_passage_attempts(student_id, unit_id);

-- RLS
ALTER TABLE naesin_passage_attempts ENABLE ROW LEVEL SECURITY;

-- Students can insert their own attempts
CREATE POLICY "Students insert own passage attempts" ON naesin_passage_attempts
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can read their own attempts
CREATE POLICY "Students read own passage attempts" ON naesin_passage_attempts
  FOR SELECT USING (auth.uid() = student_id);

-- Teachers/admin/boss can read attempts for their academy's students
CREATE POLICY "Staff read passage attempts" ON naesin_passage_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('teacher', 'admin', 'boss')
        AND u.academy_id = (SELECT academy_id FROM users WHERE id = naesin_passage_attempts.student_id)
    )
  );
