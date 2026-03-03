-- ============================================
-- Fix: RLS infinite recursion on users table
--
-- Problem: policies reference users table with self-referential
-- subqueries, causing "infinite recursion detected in policy for
-- relation users" on INSERT/UPDATE/DELETE to tables whose policies
-- also reference users.
--
-- Solution: SECURITY DEFINER helper functions that bypass RLS
-- to read the current user's role and academy_id.
-- ============================================

-- Helper: get current user's role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM users WHERE id = auth.uid()
$$;

-- Helper: get current user's academy_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_academy_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT academy_id FROM users WHERE id = auth.uid()
$$;

-- ============================================
-- Fix users table policies (self-referential)
-- ============================================

DROP POLICY IF EXISTS "Users: read own profile" ON users;
CREATE POLICY "Users: read own profile" ON users
  FOR SELECT USING (
    id = auth.uid()
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND academy_id = get_my_academy_id()
    )
    OR get_my_role() = 'boss'
  );

-- ============================================
-- Fix academies policies
-- ============================================

DROP POLICY IF EXISTS "Academies: readable by members" ON academies;
CREATE POLICY "Academies: readable by members" ON academies
  FOR SELECT USING (
    id = get_my_academy_id()
    OR get_my_role() = 'boss'
  );

DROP POLICY IF EXISTS "Academies: manageable by boss" ON academies;
CREATE POLICY "Academies: manageable by boss" ON academies
  FOR ALL USING (get_my_role() = 'boss');

-- ============================================
-- Fix Phase 1 content policies
-- ============================================

DROP POLICY IF EXISTS "Levels: manageable by teachers+" ON levels;
CREATE POLICY "Levels: manageable by teachers+" ON levels
  FOR ALL USING (get_my_role() IN ('teacher', 'admin', 'boss'));

DROP POLICY IF EXISTS "Grammars: manageable by teachers+" ON grammars;
CREATE POLICY "Grammars: manageable by teachers+" ON grammars
  FOR ALL USING (get_my_role() IN ('teacher', 'admin', 'boss'));

DROP POLICY IF EXISTS "Memory items: manageable by teachers+" ON memory_items;
CREATE POLICY "Memory items: manageable by teachers+" ON memory_items
  FOR ALL USING (get_my_role() IN ('teacher', 'admin', 'boss'));

DROP POLICY IF EXISTS "Textbook passages: manageable by teachers+" ON textbook_passages;
CREATE POLICY "Textbook passages: manageable by teachers+" ON textbook_passages
  FOR ALL USING (get_my_role() IN ('teacher', 'admin', 'boss'));

-- ============================================
-- Fix Phase 1 teacher-read policies
-- ============================================

DROP POLICY IF EXISTS "Memory progress: teacher read" ON student_memory_progress;
CREATE POLICY "Memory progress: teacher read" ON student_memory_progress
  FOR SELECT USING (
    (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = student_memory_progress.student_id
        AND users.academy_id = get_my_academy_id()
      )
    )
    OR get_my_role() = 'boss'
  );

DROP POLICY IF EXISTS "Student progress: teacher read" ON student_progress;
CREATE POLICY "Student progress: teacher read" ON student_progress
  FOR SELECT USING (
    (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = student_progress.student_id
        AND users.academy_id = get_my_academy_id()
      )
    )
    OR get_my_role() = 'boss'
  );

DROP POLICY IF EXISTS "Textbook progress: teacher read" ON student_textbook_progress;
CREATE POLICY "Textbook progress: teacher read" ON student_textbook_progress
  FOR SELECT USING (
    (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = student_textbook_progress.student_id
        AND users.academy_id = get_my_academy_id()
      )
    )
    OR get_my_role() = 'boss'
  );

-- ============================================
-- Fix exams policies
-- ============================================

DROP POLICY IF EXISTS "Exams: same academy" ON exams;
CREATE POLICY "Exams: same academy" ON exams
  FOR SELECT USING (
    academy_id = get_my_academy_id()
    OR get_my_role() = 'boss'
  );

DROP POLICY IF EXISTS "Exams: manageable by teachers+" ON exams;
CREATE POLICY "Exams: manageable by teachers+" ON exams
  FOR ALL USING (
    get_my_role() IN ('teacher', 'admin', 'boss')
    AND (academy_id = get_my_academy_id() OR get_my_role() = 'boss')
  );

-- ============================================
-- Fix naesin content policies
-- ============================================

DROP POLICY IF EXISTS "Naesin textbooks: manageable by teachers+" ON naesin_textbooks;
CREATE POLICY "Naesin textbooks: manageable by teachers+" ON naesin_textbooks
  FOR ALL USING (get_my_role() IN ('teacher', 'admin', 'boss'));

DROP POLICY IF EXISTS "Naesin units: manageable by teachers+" ON naesin_units;
CREATE POLICY "Naesin units: manageable by teachers+" ON naesin_units
  FOR ALL USING (get_my_role() IN ('teacher', 'admin', 'boss'));

DROP POLICY IF EXISTS "Naesin vocabulary: manageable by teachers+" ON naesin_vocabulary;
CREATE POLICY "Naesin vocabulary: manageable by teachers+" ON naesin_vocabulary
  FOR ALL USING (get_my_role() IN ('teacher', 'admin', 'boss'));

DROP POLICY IF EXISTS "Naesin passages: manageable by teachers+" ON naesin_passages;
CREATE POLICY "Naesin passages: manageable by teachers+" ON naesin_passages
  FOR ALL USING (get_my_role() IN ('teacher', 'admin', 'boss'));

DROP POLICY IF EXISTS "Naesin grammar lessons: manageable by teachers+" ON naesin_grammar_lessons;
CREATE POLICY "Naesin grammar lessons: manageable by teachers+" ON naesin_grammar_lessons
  FOR ALL USING (get_my_role() IN ('teacher', 'admin', 'boss'));

DROP POLICY IF EXISTS "Naesin OMR sheets: manageable by teachers+" ON naesin_omr_sheets;
CREATE POLICY "Naesin OMR sheets: manageable by teachers+" ON naesin_omr_sheets
  FOR ALL USING (get_my_role() IN ('teacher', 'admin', 'boss'));

-- ============================================
-- Fix naesin teacher-read policies
-- ============================================

DROP POLICY IF EXISTS "Naesin student progress: teacher read" ON naesin_student_progress;
CREATE POLICY "Naesin student progress: teacher read" ON naesin_student_progress
  FOR SELECT USING (
    (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = naesin_student_progress.student_id
        AND users.academy_id = get_my_academy_id()
      )
    )
    OR get_my_role() = 'boss'
  );

DROP POLICY IF EXISTS "Naesin OMR attempts: teacher read" ON naesin_omr_attempts;
CREATE POLICY "Naesin OMR attempts: teacher read" ON naesin_omr_attempts
  FOR SELECT USING (
    (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = naesin_omr_attempts.student_id
        AND users.academy_id = get_my_academy_id()
      )
    )
    OR get_my_role() = 'boss'
  );
