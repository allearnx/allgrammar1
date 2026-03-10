-- ============================================
-- 021: RLS 보안 강화 — adminClient 남용 정리
-- ============================================

-- 1-A. weekly_reports: teacher DELETE 정책 추가
-- 현재 INSERT/UPDATE만 있고 DELETE 없어서 adminClient 우회 중
CREATE POLICY "teachers_delete_academy_reports"
  ON weekly_reports FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users t
      JOIN users s ON s.academy_id = t.academy_id
      WHERE t.id = auth.uid()
        AND t.role = 'teacher'
        AND s.id = weekly_reports.student_id
    )
  );

-- 1-B. users: boss 전체 관리 정책
CREATE POLICY "boss_manage_users"
  ON users FOR ALL
  USING (get_my_role() = 'boss');

-- 1-B. users: admin이 같은 학원 teacher UPDATE 정책
CREATE POLICY "admin_update_academy_teachers"
  ON users FOR UPDATE
  USING (
    get_my_role() = 'admin'
    AND academy_id = get_my_academy_id()
    AND role = 'teacher'
  );

-- 1-C. service_assignments: teacher/admin이 같은 학원 학생 배정 읽기
CREATE POLICY "teachers_read_academy_assignments"
  ON service_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users t
      JOIN users s ON s.academy_id = t.academy_id
      WHERE t.id = auth.uid()
        AND t.role IN ('teacher', 'admin')
        AND s.id = service_assignments.student_id
    )
  );
