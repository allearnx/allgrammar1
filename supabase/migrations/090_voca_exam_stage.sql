-- ============================================
-- 090: 올킬보카 "표제어 스펠링 시험" 단계 (v1)
--   1회독 마지막에 추가되는 시험 단계. 최고 점수만 기록, 90점 통과.
--   오답은 최고점 회차 기준으로 보관(향후 올킬오답 복습 연동).
-- ============================================

ALTER TABLE voca_student_progress
  ADD COLUMN IF NOT EXISTS exam_score INTEGER,
  ADD COLUMN IF NOT EXISTS exam_wrong_words JSONB;
