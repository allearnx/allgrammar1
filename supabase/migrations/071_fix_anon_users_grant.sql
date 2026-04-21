-- 071: anon role에 users 테이블 SELECT 권한 부여
--
-- 문제: courses, reviews, faqs, teacher_profiles 등 공개 테이블의
-- RLS 정책(boss_all 등)이 users 테이블을 참조하는데,
-- anon role에 users SELECT 권한이 없어서 비로그인 방문자의
-- 공개 페이지 조회가 전부 실패함.
--
-- 해결: GRANT SELECT to anon. users 테이블의 RLS 정책이
-- 실제 데이터 접근을 여전히 보호함 (anon은 아무 행도 읽을 수 없음).

GRANT SELECT ON users TO anon;
