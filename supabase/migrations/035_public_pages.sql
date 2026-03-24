-- 035: 공개 홍보 페이지용 테이블
-- courses, teacher_profiles, reviews, faqs, consultations

-- ============================================================
-- 1. ENUM: course_category
-- ============================================================
DO $$ BEGIN
  CREATE TYPE course_category AS ENUM ('grammar', 'school_exam', 'international', 'voca', 'reading');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. courses
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  title       text NOT NULL,
  category    course_category NOT NULL DEFAULT 'grammar',
  description text NOT NULL DEFAULT '',
  price       integer NOT NULL DEFAULT 0,
  thumbnail_url   text,
  detail_image_url text,
  teacher_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_active   ON courses(is_active) WHERE is_active = true;

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_courses_updated_at();

-- RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_public_read"
  ON courses FOR SELECT
  USING (is_active = true);

CREATE POLICY "courses_boss_all"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('boss', 'admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('boss', 'admin', 'teacher')
    )
  );

-- ============================================================
-- 3. teacher_profiles (공개 홍보용 선생님 프로필)
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  user_id      uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio          text NOT NULL DEFAULT '',
  image_url    text,
  image_position text NOT NULL DEFAULT 'center',
  is_visible   boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_visible ON teacher_profiles(is_visible) WHERE is_visible = true;

CREATE OR REPLACE FUNCTION update_teacher_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_teacher_profiles_updated_at ON teacher_profiles;
CREATE TRIGGER trg_teacher_profiles_updated_at
  BEFORE UPDATE ON teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION update_teacher_profiles_updated_at();

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_profiles_public_read"
  ON teacher_profiles FOR SELECT
  USING (is_visible = true);

CREATE POLICY "teacher_profiles_boss_all"
  ON teacher_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('boss', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('boss', 'admin')
    )
  );

-- ============================================================
-- 4. reviews (수강 후기)
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  student_grade text NOT NULL DEFAULT '',
  course_name   text NOT NULL DEFAULT '',
  content       text NOT NULL,
  achievement   text,
  display_order integer NOT NULL DEFAULT 0,
  is_visible    boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_reviews_visible ON reviews(is_visible) WHERE is_visible = true;

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read"
  ON reviews FOR SELECT
  USING (is_visible = true);

CREATE POLICY "reviews_boss_all"
  ON reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('boss', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('boss', 'admin')
    )
  );

-- ============================================================
-- 5. faqs
-- ============================================================
CREATE TABLE IF NOT EXISTS faqs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  question      text NOT NULL,
  answer        text NOT NULL,
  category      text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  is_visible    boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_faqs_visible ON faqs(is_visible) WHERE is_visible = true;

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faqs_public_read"
  ON faqs FOR SELECT
  USING (is_visible = true);

CREATE POLICY "faqs_boss_all"
  ON faqs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('boss', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('boss', 'admin')
    )
  );

-- ============================================================
-- 6. consultations (상담 신청)
-- ============================================================
CREATE TABLE IF NOT EXISTS consultations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  student_name       text NOT NULL,
  grade              text NOT NULL,
  parent_phone       text NOT NULL,
  interest_course_ids uuid[] NOT NULL DEFAULT '{}',
  status             text NOT NULL DEFAULT 'new',
  memo               text NOT NULL DEFAULT ''
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- 누구나 INSERT (비로그인 포함 → anon key)
CREATE POLICY "consultations_anyone_insert"
  ON consultations FOR INSERT
  WITH CHECK (true);

-- boss/admin만 SELECT/UPDATE
CREATE POLICY "consultations_boss_read"
  ON consultations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('boss', 'admin')
    )
  );

CREATE POLICY "consultations_boss_update"
  ON consultations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('boss', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('boss', 'admin')
    )
  );
