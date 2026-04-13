-- Track which stage the student is currently studying (for live monitor)
ALTER TABLE naesin_student_progress
  ADD COLUMN IF NOT EXISTS current_stage TEXT;
