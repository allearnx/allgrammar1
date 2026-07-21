-- ============================================
-- 100: 표제어 시험 학생별 강도 (합격선·시간제한·오답 재시험)
--   보카트레인식 "단어 시험" 개인화 — 학습 7단계는 미적용, 표제어 스펠링 시험에만.
--   원장/선생님이 학생마다 합격선(70~100)·단어당 제한시간·오답 재시험 여부를 설정.
--   NULL = 시스템 기본(합격 90 / 무제한 / 재시험 off). 1단계는 학생별 예외만,
--   학원 기본값·배정시험 오버라이드는 2단계.
-- ============================================

ALTER TABLE service_assignments
  ADD COLUMN IF NOT EXISTS voca_exam_pass_score INTEGER
    CHECK (voca_exam_pass_score IS NULL OR (voca_exam_pass_score BETWEEN 50 AND 100)),
  ADD COLUMN IF NOT EXISTS voca_exam_seconds_per_word INTEGER
    CHECK (voca_exam_seconds_per_word IS NULL OR (voca_exam_seconds_per_word BETWEEN 0 AND 60)),
  ADD COLUMN IF NOT EXISTS voca_exam_retry_wrong BOOLEAN;
