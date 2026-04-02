-- ============================================
-- 050: 교과서 설명 영상 (textbookVideo) + 예상문제 (mockExam) 단계 추가
-- ============================================

-- 1. naesin_textbook_videos: 교과서 설명 영상 테이블
CREATE TABLE IF NOT EXISTS naesin_textbook_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_url TEXT,
  youtube_video_id TEXT,
  video_duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE naesin_textbook_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read textbook videos"
  ON naesin_textbook_videos FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage textbook videos"
  ON naesin_textbook_videos FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- 2. naesin_textbook_video_progress: 교과서 영상 시청 진도
CREATE TABLE IF NOT EXISTS naesin_textbook_video_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES naesin_textbook_videos(id) ON DELETE CASCADE,
  watch_percent INTEGER NOT NULL DEFAULT 0,
  max_position_reached REAL NOT NULL DEFAULT 0,
  duration REAL NOT NULL DEFAULT 0,
  cumulative_watch_seconds REAL NOT NULL DEFAULT 0,
  last_position REAL NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, video_id)
);

ALTER TABLE naesin_textbook_video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own textbook video progress"
  ON naesin_textbook_video_progress FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view textbook video progress"
  ON naesin_textbook_video_progress FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- 3. naesin_student_progress에 새 컬럼 추가
ALTER TABLE naesin_student_progress
ADD COLUMN IF NOT EXISTS textbook_video_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS textbook_videos_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS textbook_total_videos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mock_exam_completed BOOLEAN DEFAULT false;

-- 4. naesin_problem_sheets.category CHECK 수정: mock_exam 추가
ALTER TABLE naesin_problem_sheets
DROP CONSTRAINT IF EXISTS naesin_problem_sheets_category_check;

ALTER TABLE naesin_problem_sheets
ADD CONSTRAINT naesin_problem_sheets_category_check
CHECK (category IN ('problem', 'last_review', 'mock_exam'));

-- 5. naesin_student_settings.enabled_stages 기본값 업데이트
ALTER TABLE naesin_student_settings
ALTER COLUMN enabled_stages SET DEFAULT '["vocab","passage","dialogue","textbookVideo","grammar","problem","mockExam","lastReview"]';
