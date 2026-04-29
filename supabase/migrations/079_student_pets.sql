-- 병아리 키우기: 학생 펫 테이블
CREATE TABLE IF NOT EXISTS student_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage INT NOT NULL DEFAULT 0,          -- 0=알, 1=금간알, 2=병아리, 3=중간닭, 4=황금닭
  xp INT NOT NULL DEFAULT 0,
  last_fed_at TIMESTAMPTZ,
  last_fed_day_id UUID,                  -- 같은 Day 중복 방지
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

CREATE INDEX idx_student_pets_student ON student_pets(student_id);

ALTER TABLE student_pets ENABLE ROW LEVEL SECURITY;

-- 학생: 본인 데이터 전체 권한
CREATE POLICY "student_pets_own" ON student_pets
  FOR ALL USING (student_id = auth.uid());

-- boss: 전체 조회
CREATE POLICY "student_pets_boss" ON student_pets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'boss')
  );

-- teacher/admin: 같은 학원 학생만 조회
CREATE POLICY "student_pets_staff_academy" ON student_pets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS staff
      JOIN users AS student ON student.id = student_pets.student_id
      WHERE staff.id = auth.uid()
        AND staff.role IN ('teacher', 'admin')
        AND staff.academy_id = student.academy_id
    )
  );
