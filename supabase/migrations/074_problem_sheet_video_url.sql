ALTER TABLE naesin_problem_sheets ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 외부지문 영상 시청 진도 추적
CREATE TABLE IF NOT EXISTS naesin_ep_video_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sheet_id UUID NOT NULL REFERENCES naesin_problem_sheets(id) ON DELETE CASCADE,
  watch_percent INTEGER NOT NULL DEFAULT 0,
  max_position_reached REAL NOT NULL DEFAULT 0,
  duration REAL NOT NULL DEFAULT 0,
  cumulative_watch_seconds REAL NOT NULL DEFAULT 0,
  last_position REAL NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, sheet_id)
);

ALTER TABLE naesin_ep_video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own ep video progress"
  ON naesin_ep_video_progress FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers view ep video progress"
  ON naesin_ep_video_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher','admin','boss')));
