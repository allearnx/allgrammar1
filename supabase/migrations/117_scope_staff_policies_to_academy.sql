-- ============================================
-- 117: 학생 데이터 스태프 정책을 학원 범위로 좁힘
--
-- 문제: 아래 테이블의 스태프 정책이 "role이 teacher/admin(/boss)이면 통과"만 보고
--       학생의 학원을 확인하지 않아, 아무 학원의 선생님·원장이 REST로 다른 학원
--       (학원 없는 개인 학생 포함) 학생의 시험·퀴즈·오답·영상 진도 등을 전부 읽을 수
--       있었음. 선생님은 초대코드로, 원장은 새 학원 이름으로 누구나 가입할 수 있어
--       사실상 공개 상태.
--
-- 수정: boss는 그대로 전체. teacher/admin은 학생의 users.academy_id =
--       get_my_academy_id()인 행만. 학원이 없는(academy_id NULL) 스태프는
--       NULL = NULL이 참이 아니므로 아무 학생 행도 못 봄.
--       역할 집합은 원래 정책 그대로 (boss/admin 정책에 teacher를 새로 넣지 않음).
--       ALL 정책은 WITH CHECK를 생략해 USING이 쓰기 검사에도 그대로 적용됨.
--
-- 이미 학원 범위였던 정책(voca_attempt_log·voca_wrong_review·student_pets·
-- service_assignments 선생님 읽기·weekly_reports 선생님 읽기 등)과 GRANT는 건드리지 않음.
-- service_role(admin 클라이언트)은 RLS를 우회하므로 영향 없음.
-- ============================================

-- 1. 읽기 정책 (teacher/admin/boss → boss 전체 + teacher/admin 같은 학원)

-- naesin_ep_video_progress (074)
DROP POLICY IF EXISTS "Teachers view ep video progress" ON naesin_ep_video_progress;
CREATE POLICY "naesin_ep_video_progress_staff_read_academy"
  ON naesin_ep_video_progress FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_ep_video_progress.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- naesin_exam_dates (009)
DROP POLICY IF EXISTS "Teachers can view exam dates" ON naesin_exam_dates;
CREATE POLICY "naesin_exam_dates_staff_read_academy"
  ON naesin_exam_dates FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_exam_dates.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- naesin_grammar_chat_sessions (014)
DROP POLICY IF EXISTS "Teachers can view chat sessions" ON naesin_grammar_chat_sessions;
CREATE POLICY "naesin_grammar_chat_sessions_staff_read_academy"
  ON naesin_grammar_chat_sessions FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_grammar_chat_sessions.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- naesin_grammar_video_progress (009)
DROP POLICY IF EXISTS "Teachers can view video progress" ON naesin_grammar_video_progress;
CREATE POLICY "naesin_grammar_video_progress_staff_read_academy"
  ON naesin_grammar_video_progress FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_grammar_video_progress.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- naesin_problem_attempts (009)
DROP POLICY IF EXISTS "Teachers can view problem attempts" ON naesin_problem_attempts;
CREATE POLICY "naesin_problem_attempts_staff_read_academy"
  ON naesin_problem_attempts FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_problem_attempts.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- naesin_problem_drafts (056)
DROP POLICY IF EXISTS "Problem drafts: teacher read" ON naesin_problem_drafts;
CREATE POLICY "naesin_problem_drafts_staff_read_academy"
  ON naesin_problem_drafts FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_problem_drafts.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- naesin_textbook_video_progress (050)
DROP POLICY IF EXISTS "Teachers can view textbook video progress" ON naesin_textbook_video_progress;
CREATE POLICY "naesin_textbook_video_progress_staff_read_academy"
  ON naesin_textbook_video_progress FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_textbook_video_progress.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- naesin_vocab_quiz_results (008)
DROP POLICY IF EXISTS "Teachers and admins can view all quiz results" ON naesin_vocab_quiz_results;
CREATE POLICY "naesin_vocab_quiz_results_staff_read_academy"
  ON naesin_vocab_quiz_results FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_vocab_quiz_results.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- naesin_vocab_quiz_set_results (009)
DROP POLICY IF EXISTS "Teachers can view quiz set results" ON naesin_vocab_quiz_set_results;
CREATE POLICY "naesin_vocab_quiz_set_results_staff_read_academy"
  ON naesin_vocab_quiz_set_results FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_vocab_quiz_set_results.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- naesin_workbook_omr_attempts (015b)
DROP POLICY IF EXISTS "omr_attempts_teacher_select" ON naesin_workbook_omr_attempts;
CREATE POLICY "naesin_workbook_omr_attempts_staff_read_academy"
  ON naesin_workbook_omr_attempts FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_workbook_omr_attempts.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- naesin_wrong_answers (009)
DROP POLICY IF EXISTS "Teachers can view wrong answers" ON naesin_wrong_answers;
CREATE POLICY "naesin_wrong_answers_staff_read_academy"
  ON naesin_wrong_answers FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_wrong_answers.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- voca_diagnostic_results (097)
DROP POLICY IF EXISTS "staff_read_all_voca_diagnostic_results" ON voca_diagnostic_results;
CREATE POLICY "voca_diagnostic_results_staff_read_academy"
  ON voca_diagnostic_results FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = voca_diagnostic_results.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- voca_exam_assignments (092)
DROP POLICY IF EXISTS "staff_read_all_voca_exam_assignments" ON voca_exam_assignments;
CREATE POLICY "voca_exam_assignments_staff_read_academy"
  ON voca_exam_assignments FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = voca_exam_assignments.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- voca_exam_results (091)
DROP POLICY IF EXISTS "staff_read_all_voca_exam_results" ON voca_exam_results;
CREATE POLICY "voca_exam_results_staff_read_academy"
  ON voca_exam_results FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = voca_exam_results.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- voca_quiz_results (024)
DROP POLICY IF EXISTS "staff_read_all_voca_quiz_results" ON voca_quiz_results;
CREATE POLICY "voca_quiz_results_staff_read_academy"
  ON voca_quiz_results FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = voca_quiz_results.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- 2. 관리(ALL) 정책 — 읽기·쓰기 모두 같은 학원 학생만

-- naesin_exam_assignments (013, 원래 teacher/admin/boss)
DROP POLICY IF EXISTS "Teachers can manage exam assignments" ON naesin_exam_assignments;
CREATE POLICY "naesin_exam_assignments_staff_manage_academy"
  ON naesin_exam_assignments FOR ALL
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('teacher', 'admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = naesin_exam_assignments.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- service_assignments (011, 원래 boss/admin)
DROP POLICY IF EXISTS "boss_admin_manage_assignments" ON service_assignments;
CREATE POLICY "service_assignments_staff_manage_academy"
  ON service_assignments FOR ALL
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = service_assignments.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- voca_book_assignments (023, 원래 boss/admin)
DROP POLICY IF EXISTS "boss_admin_manage_book_assignments" ON voca_book_assignments;
CREATE POLICY "voca_book_assignments_staff_manage_academy"
  ON voca_book_assignments FOR ALL
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = voca_book_assignments.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );

-- weekly_reports (012, 원래 boss/admin)
DROP POLICY IF EXISTS "boss_admin_manage_reports" ON weekly_reports;
CREATE POLICY "weekly_reports_staff_manage_academy"
  ON weekly_reports FOR ALL
  USING (
    get_my_role() = 'boss'
    OR (
      get_my_role() IN ('admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = weekly_reports.student_id
          AND s.academy_id = get_my_academy_id()
      )
    )
  );
