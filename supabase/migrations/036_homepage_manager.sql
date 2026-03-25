-- 036: is_homepage_manager 플래그 추가
-- boss 외에 특정 사용자에게 홈페이지 관리 권한 부여

-- 1. users 테이블에 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_homepage_manager boolean NOT NULL DEFAULT false;

-- 2. RLS 정책 업데이트: is_homepage_manager도 허용
-- courses
DROP POLICY IF EXISTS "courses_boss_all" ON courses;
CREATE POLICY "courses_boss_all"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role IN ('boss', 'admin', 'teacher') OR users.is_homepage_manager = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role IN ('boss', 'admin', 'teacher') OR users.is_homepage_manager = true)
    )
  );

-- teacher_profiles
DROP POLICY IF EXISTS "teacher_profiles_boss_all" ON teacher_profiles;
CREATE POLICY "teacher_profiles_boss_all"
  ON teacher_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role IN ('boss', 'admin') OR users.is_homepage_manager = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role IN ('boss', 'admin') OR users.is_homepage_manager = true)
    )
  );

-- reviews
DROP POLICY IF EXISTS "reviews_boss_all" ON reviews;
CREATE POLICY "reviews_boss_all"
  ON reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role IN ('boss', 'admin') OR users.is_homepage_manager = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role IN ('boss', 'admin') OR users.is_homepage_manager = true)
    )
  );

-- faqs
DROP POLICY IF EXISTS "faqs_boss_all" ON faqs;
CREATE POLICY "faqs_boss_all"
  ON faqs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role IN ('boss', 'admin') OR users.is_homepage_manager = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role IN ('boss', 'admin') OR users.is_homepage_manager = true)
    )
  );

-- consultations (SELECT + UPDATE만)
DROP POLICY IF EXISTS "consultations_boss_read" ON consultations;
CREATE POLICY "consultations_boss_read"
  ON consultations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role IN ('boss', 'admin') OR users.is_homepage_manager = true)
    )
  );

DROP POLICY IF EXISTS "consultations_boss_update" ON consultations;
CREATE POLICY "consultations_boss_update"
  ON consultations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role IN ('boss', 'admin') OR users.is_homepage_manager = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (users.role IN ('boss', 'admin') OR users.is_homepage_manager = true)
    )
  );
