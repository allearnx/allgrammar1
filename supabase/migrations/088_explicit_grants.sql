-- 088: 전체 테이블 명시적 GRANT 부여
--
-- 배경: 2026-10-30부터 Supabase 신규 정책에 따라
-- public 스키마 테이블에 명시적 GRANT가 필요.
-- 기존에는 암묵적 권한으로 동작했으나, 기한 이후 접근 불가.
--
-- 원칙:
--   - RLS가 행 단위 보안을 담당 (모든 테이블 RLS ON 확인 완료)
--   - GRANT는 테이블 단위 접근 허용만 담당
--   - service_role은 Supabase 기본 전체 권한이므로 별도 GRANT 불필요
--   - anon: 공개 페이지에서 필요한 테이블만 최소 권한
--   - authenticated: 로그인 사용자 (학생/선생/관리자) — RLS가 역할별 필터링

-- ============================================================
-- 1. anon role — 비로그인 공개 접근 (최소 권한)
-- ============================================================

-- 이미 존재: GRANT SELECT ON users TO anon (071번 마이그레이션)
-- 사유: 공개 페이지 RLS 정책이 users 테이블 참조

-- 공개 콘텐츠 조회
GRANT SELECT ON blog_posts TO anon;
GRANT SELECT ON courses TO anon;
GRANT SELECT ON teacher_profiles TO anon;
GRANT SELECT ON reviews TO anon;
GRANT SELECT ON faqs TO anon;
GRANT SELECT ON subscription_plans TO anon;

-- 상담 신청 (비로그인 방문자가 폼 제출)
GRANT SELECT, INSERT ON consultations TO anon;

-- ============================================================
-- 2. authenticated role — 로그인 사용자 전체
--    (학생/선생/관리자 구분은 RLS 정책이 담당)
-- ============================================================

-- ── 사용자/학원 관리 ──
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON academies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_pets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_assignments TO authenticated;

-- ── 기존 문법 학습 (올그래머) ──
GRANT SELECT, INSERT, UPDATE, DELETE ON levels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON grammars TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON textbook_passages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_memory_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON student_textbook_progress TO authenticated;

-- ── 내신 대비 — 콘텐츠 ──
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_textbooks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_units TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_vocabulary TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_passages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_grammar_lessons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_dialogues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_workbooks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_problem_sheets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_similar_problems TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_omr_sheets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_workbook_omr_sheets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_textbook_videos TO authenticated;

-- ── 내신 대비 — 학생 진도/제출 ──
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_student_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_student_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_problem_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_problem_drafts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_passage_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_omr_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_workbook_omr_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_vocab_quiz_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_vocab_quiz_sets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_vocab_quiz_set_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_wrong_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_last_review_content TO authenticated;

-- ── 내신 대비 — 영상 진도 ──
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_grammar_video_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_textbook_video_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_ep_video_progress TO authenticated;

-- ── 내신 대비 — 소크라틱 채팅 ──
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_grammar_chat_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_grammar_chat_questions TO authenticated;

-- ── 내신 대비 — AI 분석/시험 ──
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_ai_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_exam_dates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON naesin_exam_assignments TO authenticated;

-- ── 보카 (올킬보카) ──
GRANT SELECT, INSERT, UPDATE, DELETE ON voca_books TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voca_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voca_vocabulary TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voca_book_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voca_student_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voca_quiz_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voca_attempt_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voca_matching_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voca_wrong_review TO authenticated;

-- ── 결제/구독 ──
GRANT SELECT, INSERT, UPDATE, DELETE ON subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;

-- ── 공개 콘텐츠 (로그인 사용자도 조회 필요) ──
GRANT SELECT, INSERT, UPDATE, DELETE ON courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON teacher_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON faqs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON consultations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_posts TO authenticated;

-- ── 공지/알림 ──
GRANT SELECT, INSERT, UPDATE, DELETE ON announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON announcement_reads TO authenticated;

-- ── 관리/분석 ──
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON weekly_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON learning_materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON learning_daily_log TO authenticated;
