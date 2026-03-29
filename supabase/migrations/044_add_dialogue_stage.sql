-- 044: Add dialogue (대화문 암기) stage to naesin

-- 1. Create naesin_dialogues table
CREATE TABLE naesin_dialogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sentences JSONB NOT NULL DEFAULT '[]',
  -- sentences: [{ original: string, korean: string, speaker?: string }]
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_naesin_dialogues_unit ON naesin_dialogues(unit_id);

-- 2. Add dialogue progress columns to naesin_student_progress
ALTER TABLE naesin_student_progress
  ADD COLUMN dialogue_translation_best INT DEFAULT NULL,
  ADD COLUMN dialogue_completed BOOLEAN NOT NULL DEFAULT false;

-- 3. RLS policies
ALTER TABLE naesin_dialogues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "naesin_dialogues_select" ON naesin_dialogues
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "naesin_dialogues_insert" ON naesin_dialogues
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "naesin_dialogues_update" ON naesin_dialogues
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "naesin_dialogues_delete" ON naesin_dialogues
  FOR DELETE TO authenticated USING (true);
