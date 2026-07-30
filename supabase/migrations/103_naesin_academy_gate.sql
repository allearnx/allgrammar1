-- ============================================
-- 내신 관리 올라영 전용 잠금 (naesin_enabled)
-- ============================================
-- 배경: 내신 콘텐츠 테이블은 단일 학원 시절 설계라 학원 구분이 없고,
-- RLS가 "어느 학원이든 teacher/admin이면 전부 관리 가능"이었다.
-- 올킬보카 외부 가입이 열리면서 외부 학원 teacher/admin이 내신 관리 화면·API로
-- 전체 콘텐츠를 열람/수정할 수 있는 구멍이 됨 (2026-07-30 발견).
--
-- 잠금 설계:
-- - academies.naesin_enabled (기본 false) — 내신 서비스가 활성화된 학원만 관리 가능.
--   추후 외부 판매 시 해당 학원의 스위치만 켜면 됨.
-- - 콘텐츠 쓰기(manage) 정책: boss 또는 naesin_enabled 학원의 teacher/admin만.
-- - 콘텐츠 읽기: 학생 무료 체험(내신 1단원)이 의도된 기능이므로 인증 사용자 읽기는 유지.
--   단, USING(true)로 익명(anon)까지 읽히던 정책은 인증 필수로 강화.
-- - naesin_templates 읽기: 학생 대면 아닌 관리 자산이므로 관리 권한 기준으로 잠금.

-- 1. 학원별 내신 활성 스위치
ALTER TABLE academies ADD COLUMN IF NOT EXISTS naesin_enabled BOOLEAN NOT NULL DEFAULT false;

-- 2. 올라영(기존 운영 학원) 활성화 — boss 소속 학원, 없으면 최초 생성 학원
UPDATE academies SET naesin_enabled = true
WHERE id IN (SELECT academy_id FROM users WHERE role = 'boss' AND academy_id IS NOT NULL);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM academies WHERE naesin_enabled) THEN
    UPDATE academies SET naesin_enabled = true
    WHERE id = (SELECT id FROM academies ORDER BY created_at ASC LIMIT 1);
  END IF;
END $$;

-- 3. 관리 권한 헬퍼 — boss 또는 naesin_enabled 학원의 teacher/admin
CREATE OR REPLACE FUNCTION public.naesin_manage_allowed()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.get_my_role() = 'boss' THEN true
    WHEN public.get_my_role() IN ('teacher', 'admin') THEN EXISTS (
      SELECT 1 FROM academies a
      WHERE a.id = public.get_my_academy_id() AND a.naesin_enabled
    )
    ELSE false
  END
$$;

-- 4. 콘텐츠 쓰기(manage) 정책 교체 — 002/003 계열
DROP POLICY IF EXISTS "Naesin textbooks: manageable by teachers+" ON naesin_textbooks;
CREATE POLICY "Naesin textbooks: manageable by teachers+" ON naesin_textbooks
  FOR ALL USING (naesin_manage_allowed());

DROP POLICY IF EXISTS "Naesin units: manageable by teachers+" ON naesin_units;
CREATE POLICY "Naesin units: manageable by teachers+" ON naesin_units
  FOR ALL USING (naesin_manage_allowed());

DROP POLICY IF EXISTS "Naesin vocabulary: manageable by teachers+" ON naesin_vocabulary;
CREATE POLICY "Naesin vocabulary: manageable by teachers+" ON naesin_vocabulary
  FOR ALL USING (naesin_manage_allowed());

DROP POLICY IF EXISTS "Naesin passages: manageable by teachers+" ON naesin_passages;
CREATE POLICY "Naesin passages: manageable by teachers+" ON naesin_passages
  FOR ALL USING (naesin_manage_allowed());

DROP POLICY IF EXISTS "Naesin grammar lessons: manageable by teachers+" ON naesin_grammar_lessons;
CREATE POLICY "Naesin grammar lessons: manageable by teachers+" ON naesin_grammar_lessons
  FOR ALL USING (naesin_manage_allowed());

DROP POLICY IF EXISTS "Naesin OMR sheets: manageable by teachers+" ON naesin_omr_sheets;
CREATE POLICY "Naesin OMR sheets: manageable by teachers+" ON naesin_omr_sheets
  FOR ALL USING (naesin_manage_allowed());

-- 009 계열
DROP POLICY IF EXISTS "Teachers can manage vocab quiz sets" ON naesin_vocab_quiz_sets;
CREATE POLICY "Teachers can manage vocab quiz sets" ON naesin_vocab_quiz_sets
  FOR ALL USING (naesin_manage_allowed());

DROP POLICY IF EXISTS "Teachers can manage problem sheets" ON naesin_problem_sheets;
CREATE POLICY "Teachers can manage problem sheets" ON naesin_problem_sheets
  FOR ALL USING (naesin_manage_allowed());

DROP POLICY IF EXISTS "Teachers can manage similar problems" ON naesin_similar_problems;
CREATE POLICY "Teachers can manage similar problems" ON naesin_similar_problems
  FOR ALL USING (naesin_manage_allowed());

DROP POLICY IF EXISTS "Teachers can manage last review content" ON naesin_last_review_content;
CREATE POLICY "Teachers can manage last review content" ON naesin_last_review_content
  FOR ALL USING (naesin_manage_allowed());

-- 050/051 계열
DROP POLICY IF EXISTS "Teachers can manage textbook videos" ON naesin_textbook_videos;
CREATE POLICY "Teachers can manage textbook videos" ON naesin_textbook_videos
  FOR ALL USING (naesin_manage_allowed());

-- 044 대화문 — 기존 정책이 인증 사용자 전원 쓰기 허용(true)이었음
DROP POLICY IF EXISTS "naesin_dialogues_insert" ON naesin_dialogues;
CREATE POLICY "naesin_dialogues_insert" ON naesin_dialogues
  FOR INSERT TO authenticated WITH CHECK (naesin_manage_allowed());

DROP POLICY IF EXISTS "naesin_dialogues_update" ON naesin_dialogues;
CREATE POLICY "naesin_dialogues_update" ON naesin_dialogues
  FOR UPDATE TO authenticated USING (naesin_manage_allowed());

DROP POLICY IF EXISTS "naesin_dialogues_delete" ON naesin_dialogues;
CREATE POLICY "naesin_dialogues_delete" ON naesin_dialogues
  FOR DELETE TO authenticated USING (naesin_manage_allowed());

-- 057 템플릿 — 읽기도 관리 자산이므로 잠금 (학생 대면 아님, boss 쓰기 정책은 유지)
DROP POLICY IF EXISTS "admin_read_templates" ON naesin_templates;
CREATE POLICY "admin_read_templates" ON naesin_templates
  FOR SELECT USING (naesin_manage_allowed());

-- 5. 익명 읽기 구멍 봉인 — USING(true)라 로그인 없이도 anon key로 전체 덤프 가능했음
DROP POLICY IF EXISTS "Anyone can read problem sheets" ON naesin_problem_sheets;
CREATE POLICY "Anyone can read problem sheets" ON naesin_problem_sheets
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can read vocab quiz sets" ON naesin_vocab_quiz_sets;
CREATE POLICY "Anyone can read vocab quiz sets" ON naesin_vocab_quiz_sets
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can read textbook videos" ON naesin_textbook_videos;
CREATE POLICY "Anyone can read textbook videos" ON naesin_textbook_videos
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can read last review content" ON naesin_last_review_content;
CREATE POLICY "Anyone can read last review content" ON naesin_last_review_content
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can read approved similar problems" ON naesin_similar_problems;
CREATE POLICY "Anyone can read approved similar problems" ON naesin_similar_problems
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (status = 'approved' OR get_my_role() IN ('teacher', 'admin', 'boss'))
  );
