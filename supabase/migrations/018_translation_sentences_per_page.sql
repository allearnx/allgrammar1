ALTER TABLE naesin_student_settings
  ADD COLUMN IF NOT EXISTS translation_sentences_per_page INTEGER NOT NULL DEFAULT 10;
