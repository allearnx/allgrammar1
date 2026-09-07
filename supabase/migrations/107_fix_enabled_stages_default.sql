-- ============================================
-- 107: naesin_student_settings.enabled_stages 기본값 복구
--
-- 실 DB의 컬럼 DEFAULT에 "problem"이 줄바꿈이 섞인 채("probl\n  em") 저장되어 있어
-- 2026-04-13 이후 가입 학생(23명)은 문제풀이 단계가 꺼진 상태로 생성됐다.
-- (migration 050의 파일 내용은 정상 — DB 쪽 기본값만 손상)
-- 1) DEFAULT를 정상값으로 재설정  2) 손상된 행의 값을 "problem"으로 치환
-- ============================================

ALTER TABLE naesin_student_settings
ALTER COLUMN enabled_stages SET DEFAULT '["vocab","passage","dialogue","textbookVideo","grammar","problem","mockExam","lastReview"]'::jsonb;

-- 공백/줄바꿈이 섞인 원소를 정규화 (순서 유지)
UPDATE naesin_student_settings s
SET enabled_stages = (
  SELECT COALESCE(jsonb_agg(to_jsonb(regexp_replace(e, '\s+', '', 'g')) ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements_text(s.enabled_stages) WITH ORDINALITY AS t(e, ord)
)
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements_text(s.enabled_stages) AS t(e)
  WHERE e ~ '\s'
);
