-- 118: 학생 본인 service_assignments INSERT 정책 제거
--
-- 037의 "students_insert_own_assignments"(WITH CHECK student_id = auth.uid())와
-- 088의 authenticated INSERT GRANT가 겹쳐, 로그인한 학생 누구나 PostgREST로
-- 자기 이용권(아무 service, 만료 없음, source 'payment' 포함)을 직접 만들 수 있었다.
--
-- 앱에서 학생 본인 행을 쓰는 경로는 모두 서버 admin client(service_role)로 처리한다:
--   - /api/payment/confirm           (결제 승인 후, 이미 admin client)
--   - /api/student/select-free-service (무료 플랜 서비스 선택, 이 PR에서 admin client로 이동)
--   - sync_subscription_services() (SECURITY DEFINER, 학원 구독 동기화)
-- (독립 학생 voca 자동 배정 트리거는 039에서 제거됨 → 무료 서비스는 select-free-service가 유일 경로)
-- 스태프 쓰기 정책(117 service_assignments_staff_manage_academy)과 학생 읽기 정책,
-- GRANT는 그대로 둔다.

DROP POLICY IF EXISTS "students_insert_own_assignments" ON service_assignments;
