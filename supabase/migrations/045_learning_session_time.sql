-- Add total_learning_seconds to track session-based learning time
-- (heartbeat timer for all activities: vocab, passage, grammar, problem, etc.)

ALTER TABLE naesin_student_progress
  ADD COLUMN IF NOT EXISTS total_learning_seconds INTEGER DEFAULT 0;

ALTER TABLE voca_student_progress
  ADD COLUMN IF NOT EXISTS total_learning_seconds INTEGER DEFAULT 0;
