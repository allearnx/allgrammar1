-- 올킬보카 학생에게 올인내신 암기 스테이지(단어/교과서/대화문)만 허용하는 플래그
ALTER TABLE service_assignments
  ADD COLUMN IF NOT EXISTS naesin_memorize_only BOOLEAN NOT NULL DEFAULT FALSE;

-- 인덱스: naesin_memorize_only 조건부 조회 최적화
CREATE INDEX IF NOT EXISTS idx_sa_naesin_memorize
  ON service_assignments (student_id)
  WHERE service = 'naesin' AND naesin_memorize_only = TRUE;
