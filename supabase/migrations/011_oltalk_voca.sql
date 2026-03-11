-- ============================================
-- 011: 올킬보카 + 서비스 배정 시스템
-- ============================================

-- ── 서비스 배정 (내신 + 올킬보카 공용) ──

CREATE TABLE IF NOT EXISTS service_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('naesin', 'voca')),
  assigned_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, service)
);

ALTER TABLE service_assignments ENABLE ROW LEVEL SECURITY;

-- 학생 본인 읽기
CREATE POLICY "students_read_own_assignments"
  ON service_assignments FOR SELECT
  USING (student_id = auth.uid());

-- boss/admin 전체 관리
CREATE POLICY "boss_admin_manage_assignments"
  ON service_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('boss', 'admin')
    )
  );

CREATE INDEX idx_service_assignments_student ON service_assignments(student_id);

-- ── 올킬보카 교재 ──

CREATE TABLE IF NOT EXISTS voca_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voca_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_voca_books"
  ON voca_books FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "teacher_plus_manage_voca_books"
  ON voca_books FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
    )
  );

-- ── 올킬보카 Day ──

CREATE TABLE IF NOT EXISTS voca_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES voca_books(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  title TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voca_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_voca_days"
  ON voca_days FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "teacher_plus_manage_voca_days"
  ON voca_days FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
    )
  );

CREATE INDEX idx_voca_days_book ON voca_days(book_id);

-- ── 올킬보카 단어 ──

CREATE TABLE IF NOT EXISTS voca_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES voca_days(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  part_of_speech TEXT,
  example_sentence TEXT,
  synonyms TEXT,
  antonyms TEXT,
  spelling_hint TEXT,
  spelling_answer TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voca_vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_voca_vocabulary"
  ON voca_vocabulary FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "teacher_plus_manage_voca_vocabulary"
  ON voca_vocabulary FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
    )
  );

CREATE INDEX idx_voca_vocabulary_day ON voca_vocabulary(day_id);

-- ── 학생 진도 ──

CREATE TABLE IF NOT EXISTS voca_student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES voca_days(id) ON DELETE CASCADE,
  flashcard_completed BOOLEAN DEFAULT false,
  quiz_score INT,
  spelling_score INT,
  matching_score INT,
  matching_attempt INT DEFAULT 0,
  matching_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, day_id)
);

ALTER TABLE voca_student_progress ENABLE ROW LEVEL SECURITY;

-- 학생 본인 관리
CREATE POLICY "students_manage_own_voca_progress"
  ON voca_student_progress FOR ALL
  USING (student_id = auth.uid());

-- 같은 학원 teacher 읽기
CREATE POLICY "teacher_read_academy_voca_progress"
  ON voca_student_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users t
      WHERE t.id = auth.uid()
        AND t.role = 'teacher'
        AND t.academy_id = (SELECT academy_id FROM users WHERE id = student_id)
    )
  );

-- admin: 같은 학원 읽기
CREATE POLICY "admin_read_academy_voca_progress"
  ON voca_student_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users a
      WHERE a.id = auth.uid()
        AND a.role = 'admin'
        AND a.academy_id = (SELECT academy_id FROM users WHERE id = student_id)
    )
  );

-- boss 전체 읽기
CREATE POLICY "boss_read_all_voca_progress"
  ON voca_student_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'boss'
    )
  );

CREATE INDEX idx_voca_student_progress_student ON voca_student_progress(student_id);
CREATE INDEX idx_voca_student_progress_day ON voca_student_progress(day_id);

-- ── 매칭 오답 제출 ──

CREATE TABLE IF NOT EXISTS voca_matching_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES voca_days(id) ON DELETE CASCADE,
  wrong_words JSONB NOT NULL DEFAULT '[]',
  writings JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voca_matching_submissions ENABLE ROW LEVEL SECURITY;

-- 학생 본인 관리
CREATE POLICY "students_manage_own_matching_submissions"
  ON voca_matching_submissions FOR ALL
  USING (student_id = auth.uid());

-- teacher 같은 학원 읽기 + 검토
CREATE POLICY "teacher_read_academy_matching_submissions"
  ON voca_matching_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users t
      WHERE t.id = auth.uid()
        AND t.role = 'teacher'
        AND t.academy_id = (SELECT academy_id FROM users WHERE id = student_id)
    )
  );

CREATE POLICY "teacher_update_academy_matching_submissions"
  ON voca_matching_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users t
      WHERE t.id = auth.uid()
        AND t.role IN ('teacher', 'admin')
        AND t.academy_id = (SELECT academy_id FROM users WHERE id = student_id)
    )
  );

-- boss 전체 읽기/수정
CREATE POLICY "boss_manage_all_matching_submissions"
  ON voca_matching_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'boss'
    )
  );

CREATE INDEX idx_voca_matching_submissions_student ON voca_matching_submissions(student_id);
CREATE INDEX idx_voca_matching_submissions_day ON voca_matching_submissions(day_id);
CREATE INDEX idx_voca_matching_submissions_status ON voca_matching_submissions(status);
