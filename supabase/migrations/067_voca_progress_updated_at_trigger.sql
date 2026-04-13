-- Add missing updated_at trigger for voca_student_progress
-- (naesin_student_progress already has this trigger from migration 002)
-- Without this, heartbeat calls update total_learning_seconds but updated_at stays stale

CREATE TRIGGER update_voca_student_progress_updated_at
  BEFORE UPDATE ON voca_student_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
