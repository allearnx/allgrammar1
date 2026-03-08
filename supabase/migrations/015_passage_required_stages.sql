-- Add passage_required_stages to naesin_student_settings
-- Stores which passage exercises each student must do (ordered array, duplicates allowed)
-- Example: ['fill_blanks', 'translation'] or ['fill_blanks', 'fill_blanks']
ALTER TABLE naesin_student_settings
  ADD COLUMN IF NOT EXISTS passage_required_stages JSONB NOT NULL DEFAULT '["fill_blanks", "translation"]'::jsonb;

-- Allow teachers/admin/boss to manage student settings (for passage stage config)
CREATE POLICY "Naesin student settings: teacher manage" ON naesin_student_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('teacher', 'admin', 'boss')
        AND u.academy_id = (SELECT academy_id FROM users WHERE id = naesin_student_settings.student_id)
    )
  );
