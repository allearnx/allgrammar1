-- 009_naesin_flow_overhaul.sql
-- 내신 대비 학습 흐름 전면 개편: OMR 제거, 단어 시험지, 문법 영상 80%, 문제풀이, 직전보강
-- 기존 컬럼/테이블은 삭제하지 않음 (additive only)

-- ============================================
-- 1. naesin_exam_dates: 학생별 시험일
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_exam_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  textbook_id UUID NOT NULL REFERENCES naesin_textbooks(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, textbook_id)
);

ALTER TABLE naesin_exam_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own exam dates"
  ON naesin_exam_dates FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view exam dates"
  ON naesin_exam_dates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- ============================================
-- 2. naesin_vocab_quiz_sets: 선생님이 만든 단어 시험지
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_vocab_quiz_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  set_order INTEGER NOT NULL DEFAULT 1,
  vocab_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE naesin_vocab_quiz_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vocab quiz sets"
  ON naesin_vocab_quiz_sets FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage vocab quiz sets"
  ON naesin_vocab_quiz_sets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- ============================================
-- 3. naesin_vocab_quiz_set_results: 시험지별 학생 결과
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_vocab_quiz_set_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_set_id UUID NOT NULL REFERENCES naesin_vocab_quiz_sets(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  wrong_words JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE naesin_vocab_quiz_set_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own quiz set results"
  ON naesin_vocab_quiz_set_results FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view quiz set results"
  ON naesin_vocab_quiz_set_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- ============================================
-- 4. naesin_grammar_video_progress: 영상별 시청 진도
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_grammar_video_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES naesin_grammar_lessons(id) ON DELETE CASCADE,
  watch_percent INTEGER NOT NULL DEFAULT 0,
  max_position_reached REAL NOT NULL DEFAULT 0,
  duration REAL NOT NULL DEFAULT 0,
  cumulative_watch_seconds REAL NOT NULL DEFAULT 0,
  last_position REAL NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

ALTER TABLE naesin_grammar_video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own video progress"
  ON naesin_grammar_video_progress FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view video progress"
  ON naesin_grammar_video_progress FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- ============================================
-- 5. naesin_problem_sheets: PDF 문제지
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_problem_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('interactive', 'image_answer')),
  questions JSONB DEFAULT '[]',
  pdf_url TEXT,
  answer_key JSONB DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'problem' CHECK (category IN ('problem', 'last_review')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE naesin_problem_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read problem sheets"
  ON naesin_problem_sheets FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage problem sheets"
  ON naesin_problem_sheets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- ============================================
-- 6. naesin_problem_attempts: 문제풀이 결과
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_problem_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sheet_id UUID NOT NULL REFERENCES naesin_problem_sheets(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '[]',
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  wrong_answers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE naesin_problem_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own problem attempts"
  ON naesin_problem_attempts FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view problem attempts"
  ON naesin_problem_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- ============================================
-- 7. naesin_wrong_answers: 전 단계 오답 통합
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_wrong_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('vocab', 'passage', 'grammar', 'problem', 'lastReview')),
  source_type TEXT NOT NULL,
  question_data JSONB NOT NULL DEFAULT '{}',
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE naesin_wrong_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own wrong answers"
  ON naesin_wrong_answers FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view wrong answers"
  ON naesin_wrong_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

CREATE INDEX idx_naesin_wrong_answers_student_unit
  ON naesin_wrong_answers(student_id, unit_id);

-- ============================================
-- 8. naesin_similar_problems: AI 유사문제
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_similar_problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  wrong_answer_id UUID REFERENCES naesin_wrong_answers(id) ON DELETE SET NULL,
  grammar_tag TEXT,
  question_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE naesin_similar_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved similar problems"
  ON naesin_similar_problems FOR SELECT
  USING (status = 'approved' OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

CREATE POLICY "Teachers can manage similar problems"
  ON naesin_similar_problems FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- ============================================
-- 9. naesin_last_review_content: 직전보강 콘텐츠
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_last_review_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'text')),
  title TEXT NOT NULL,
  youtube_url TEXT,
  youtube_video_id TEXT,
  pdf_url TEXT,
  text_content TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE naesin_last_review_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read last review content"
  ON naesin_last_review_content FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage last review content"
  ON naesin_last_review_content FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- ============================================
-- 10. naesin_student_progress 컬럼 추가 (additive only)
-- ============================================
ALTER TABLE naesin_student_progress
  ADD COLUMN IF NOT EXISTS vocab_quiz_sets_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vocab_total_quiz_sets INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS passage_translation_best INTEGER,
  ADD COLUMN IF NOT EXISTS grammar_videos_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grammar_total_videos INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS problem_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_review_unlocked BOOLEAN DEFAULT false;

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_naesin_exam_dates_student
  ON naesin_exam_dates(student_id);

CREATE INDEX IF NOT EXISTS idx_naesin_vocab_quiz_sets_unit
  ON naesin_vocab_quiz_sets(unit_id);

CREATE INDEX IF NOT EXISTS idx_naesin_vocab_quiz_set_results_student
  ON naesin_vocab_quiz_set_results(student_id, quiz_set_id);

CREATE INDEX IF NOT EXISTS idx_naesin_grammar_video_progress_student
  ON naesin_grammar_video_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_naesin_problem_sheets_unit
  ON naesin_problem_sheets(unit_id);

CREATE INDEX IF NOT EXISTS idx_naesin_problem_attempts_student
  ON naesin_problem_attempts(student_id, sheet_id);

CREATE INDEX IF NOT EXISTS idx_naesin_similar_problems_unit
  ON naesin_similar_problems(unit_id, status);

CREATE INDEX IF NOT EXISTS idx_naesin_last_review_content_unit
  ON naesin_last_review_content(unit_id);
