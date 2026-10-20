-- ============================================
-- 119: 원장·선생님이면 누구나 고칠 수 있던 공용 데이터 잠금
--
-- 배경: 선생님은 초대코드로, 원장은 새 학원 이름으로 누구나 가입할 수 있다.
--       그래서 "role이 admin/teacher면 통과"인 정책은 사실상 아무나 통과다.
--
-- 1. 홈페이지(consultations·faqs·reviews·teacher_profiles·courses): 아무 원장이
--    상담 신청(학부모 연락처)을 읽고 고칠 수 있었고, courses는 선생님까지 홈페이지를 고칠 수 있었음.
--    → boss 또는 is_homepage_manager만 (앱의 /api/boss/* 홈페이지 라우트와 같은 기준).
-- 2. 공용 콘텐츠(문법·레벨·암기·교과서 지문·보카 교재/Day/단어·워크북·OMR 시트·문법 채팅 질문):
--    아무 선생님·원장이 모든 학원이 같이 쓰는 콘텐츠를 고치거나 지울 수 있었음.
--    → boss 또는 can_manage_content 학원의 teacher/admin만 (requireContentPermission과 같은 기준).
-- 3. academies "admin_update_own_academy"(028): 원장이 REST로 자기 학원의
--    can_manage_content·naesin_enabled·max_students·services·free_service를 바꿀 수 있었음
--    (2번 잠금도 우회됨). 앱의 학원 수정은 전부 admin 클라이언트 → 정책 제거.
--    RLS로 쓰던 유일한 곳(onboarding-complete)은 이 PR에서 admin 클라이언트로 옮김.
-- 4. subscriptions "admin_manage_own_academy_subscriptions"(025): 원장이 자기 학원 구독을
--    tier·status·기간까지 직접 바꿀 수 있었음(결제 없이 유료 전환). 읽기는
--    read_own_subscriptions가 그대로 허용. RLS로 쓰던 billing/register-card는 admin 클라이언트로 옮김.
-- 5. payment_history "service_insert_payment_history"(025): WITH CHECK (true)라 로그인한 누구나
--    가짜 결제 기록을 넣을 수 있었음. 주석은 "cron용"이지만 service_role은 RLS를 우회하므로 불필요.
-- 6. weekly_reports 선생님 INSERT·UPDATE(012): 학원 조건이 없어 아무 학생에게나 리포트를 쓸 수 있었음.
--    → 같은 학원 학생만 (117의 학원 범위 규칙과 같음).
--
-- GRANT는 건드리지 않음. service_role(admin 클라이언트)은 RLS를 우회하므로 영향 없음.
-- ============================================

-- 1. 홈페이지: boss 또는 홈페이지 매니저 ─────────────────────────────
DROP POLICY IF EXISTS "consultations_boss_read" ON consultations;
CREATE POLICY "consultations_boss_read"
  ON consultations FOR SELECT
  USING (get_my_role() = 'boss' OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_homepage_manager = true
  ));

DROP POLICY IF EXISTS "consultations_boss_update" ON consultations;
CREATE POLICY "consultations_boss_update"
  ON consultations FOR UPDATE
  USING (get_my_role() = 'boss' OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_homepage_manager = true
  ))
  WITH CHECK (get_my_role() = 'boss' OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_homepage_manager = true
  ));

DROP POLICY IF EXISTS "faqs_boss_all" ON faqs;
CREATE POLICY "faqs_boss_all"
  ON faqs FOR ALL
  USING (get_my_role() = 'boss' OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_homepage_manager = true
  ))
  WITH CHECK (get_my_role() = 'boss' OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_homepage_manager = true
  ));

DROP POLICY IF EXISTS "reviews_boss_all" ON reviews;
CREATE POLICY "reviews_boss_all"
  ON reviews FOR ALL
  USING (get_my_role() = 'boss' OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_homepage_manager = true
  ))
  WITH CHECK (get_my_role() = 'boss' OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_homepage_manager = true
  ));

DROP POLICY IF EXISTS "teacher_profiles_boss_all" ON teacher_profiles;
CREATE POLICY "teacher_profiles_boss_all"
  ON teacher_profiles FOR ALL
  USING (get_my_role() = 'boss' OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_homepage_manager = true
  ))
  WITH CHECK (get_my_role() = 'boss' OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_homepage_manager = true
  ));

DROP POLICY IF EXISTS "courses_boss_all" ON courses;
CREATE POLICY "courses_boss_all"
  ON courses FOR ALL
  USING (get_my_role() = 'boss' OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_homepage_manager = true
  ))
  WITH CHECK (get_my_role() = 'boss' OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_homepage_manager = true
  ));

-- 2. 공용 콘텐츠: boss 또는 콘텐츠 관리 학원의 teacher/admin ──────────
--    (읽기는 각 테이블의 기존 읽기 정책이 그대로 허용)
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT * FROM (VALUES
    ('grammars',                      'Grammars: manageable by teachers+'),
    ('levels',                        'Levels: manageable by teachers+'),
    ('memory_items',                  'Memory items: manageable by teachers+'),
    ('textbook_passages',             'Textbook passages: manageable by teachers+'),
    ('voca_books',                    'teacher_plus_manage_voca_books'),
    ('voca_days',                     'teacher_plus_manage_voca_days'),
    ('voca_vocabulary',               'teacher_plus_manage_voca_vocabulary'),
    ('naesin_workbooks',              'workbooks_manage_teacher'),
    ('naesin_workbook_omr_sheets',    'omr_sheets_manage_teacher'),
    ('naesin_grammar_chat_questions', 'Teachers can manage chat questions')
  ) AS v(tbl, old_policy)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t.old_policy, t.tbl);
    EXECUTE format(
      $p$CREATE POLICY %I ON %I FOR ALL
        USING (
          get_my_role() = 'boss'
          OR (
            get_my_role() IN ('teacher', 'admin')
            AND EXISTS (
              SELECT 1 FROM academies a
              WHERE a.id = get_my_academy_id() AND a.can_manage_content
            )
          )
        )$p$,
      t.tbl || '_content_manage', t.tbl
    );
  END LOOP;
END $$;

-- 3. 학원 정보: 원장 직접 수정 정책 제거 (앱은 admin 클라이언트로 수정) ──
DROP POLICY IF EXISTS "admin_update_own_academy" ON academies;

-- 4. 구독: 원장 직접 쓰기 정책 제거 (읽기는 read_own_subscriptions) ────
DROP POLICY IF EXISTS "admin_manage_own_academy_subscriptions" ON subscriptions;

-- 5. 결제 기록: 누구나 INSERT 정책 제거 ────────────────────────────
DROP POLICY IF EXISTS "service_insert_payment_history" ON payment_history;

-- 6. 주간 리포트: 선생님 쓰기는 같은 학원 학생만 ───────────────────
DROP POLICY IF EXISTS "teachers_write_reports" ON weekly_reports;
CREATE POLICY "teachers_write_reports"
  ON weekly_reports FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users t JOIN users s ON s.academy_id = t.academy_id
    WHERE t.id = auth.uid() AND t.role = 'teacher' AND s.id = weekly_reports.student_id
  ));

DROP POLICY IF EXISTS "teachers_update_reports" ON weekly_reports;
CREATE POLICY "teachers_update_reports"
  ON weekly_reports FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users t JOIN users s ON s.academy_id = t.academy_id
    WHERE t.id = auth.uid() AND t.role = 'teacher' AND s.id = weekly_reports.student_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users t JOIN users s ON s.academy_id = t.academy_id
    WHERE t.id = auth.uid() AND t.role = 'teacher' AND s.id = weekly_reports.student_id
  ));
