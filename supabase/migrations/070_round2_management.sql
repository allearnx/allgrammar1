-- 070: Round 2 management columns

-- 1. 오답에 round 컬럼 추가
ALTER TABLE naesin_wrong_answers
  ADD COLUMN IF NOT EXISTS round INTEGER NOT NULL DEFAULT 1;

-- 2. 실시간 모니터링용 current_round 컬럼
ALTER TABLE naesin_student_progress
  ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 1;
