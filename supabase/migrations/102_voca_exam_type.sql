-- ============================================
-- 102: 표제어 시험 유형 구분 — 1회독 표제어 스펠링 / 2회독 유의어·반의어
--   결과·배정에 exam_type 추가. 기존 행은 'headword'(1회독)로 간주.
-- ============================================

ALTER TABLE voca_exam_results
  ADD COLUMN IF NOT EXISTS exam_type TEXT NOT NULL DEFAULT 'headword'
    CHECK (exam_type IN ('headword', 'syn_ant'));

ALTER TABLE voca_exam_assignments
  ADD COLUMN IF NOT EXISTS exam_type TEXT NOT NULL DEFAULT 'headword'
    CHECK (exam_type IN ('headword', 'syn_ant'));
