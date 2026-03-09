-- Add enabled_stages column to naesin_student_settings
-- Controls which stages (vocab, passage, grammar, problem, lastReview) are visible to the student
ALTER TABLE naesin_student_settings
ADD COLUMN enabled_stages JSONB DEFAULT '["vocab","passage","grammar","problem","lastReview"]';
