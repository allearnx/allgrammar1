-- 학생별 보카 학습 모드: 'book' (책 단위 회독) | 'day' (Day별 완벽 마스터)
ALTER TABLE service_assignments
  ADD COLUMN IF NOT EXISTS voca_round_mode TEXT NOT NULL DEFAULT 'book'
  CHECK (voca_round_mode IN ('book', 'day'));
