-- ============================================
-- 101: 표제어 시험 강도 2단계 — 학원 기본값 + 배정 시험 시간 오버라이드
--   병합 우선순위(위가 우선): 배정시험 override > 학생 예외 > 학원 기본 > 시스템 기본(90/0/off)
--   NULL = 하위 레이어로 폴백.
-- ============================================

-- 학원 기본 강도 (원장이 학원 전체 기본을 정함)
ALTER TABLE academies
  ADD COLUMN IF NOT EXISTS voca_exam_pass_score_default INTEGER
    CHECK (voca_exam_pass_score_default IS NULL OR (voca_exam_pass_score_default BETWEEN 50 AND 100)),
  ADD COLUMN IF NOT EXISTS voca_exam_seconds_per_word_default INTEGER
    CHECK (voca_exam_seconds_per_word_default IS NULL OR (voca_exam_seconds_per_word_default BETWEEN 0 AND 60)),
  ADD COLUMN IF NOT EXISTS voca_exam_retry_wrong_default BOOLEAN;

-- 배정 시험별 제한시간 오버라이드 (반 전체가 같은 조건으로 보는 시험용, 시간만)
ALTER TABLE voca_exam_assignments
  ADD COLUMN IF NOT EXISTS seconds_per_word INTEGER
    CHECK (seconds_per_word IS NULL OR (seconds_per_word BETWEEN 0 AND 60));
