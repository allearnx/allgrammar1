-- ============================================
-- 올라영 - 내신 대비 시스템 Schema
-- ============================================

-- ============================================
-- Tables
-- ============================================

-- 교과서 (능률 중1, 동아 중2 등)
CREATE TABLE naesin_textbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 3),
  publisher TEXT NOT NULL,
  display_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 단원
CREATE TABLE naesin_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES naesin_textbooks(id) ON DELETE CASCADE,
  unit_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stage 1: 단어
CREATE TABLE naesin_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  quiz_options JSONB,
  quiz_correct_index INTEGER,
  spelling_hint TEXT,
  spelling_answer TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stage 2: 교과서 지문
CREATE TABLE naesin_passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_text TEXT NOT NULL,
  korean_translation TEXT NOT NULL,
  blanks_easy JSONB,
  blanks_medium JSONB,
  blanks_hard JSONB,
  sentences JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stage 3: 문법 설명
CREATE TABLE naesin_grammar_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'text')),
  youtube_url TEXT,
  youtube_video_id TEXT,
  video_duration_seconds INTEGER,
  text_content TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stage 4: OMR 시트
CREATE TABLE naesin_omr_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  answer_key JSONB NOT NULL,
  points_per_question JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 학생 교과서 선택
CREATE TABLE naesin_student_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  textbook_id UUID NOT NULL REFERENCES naesin_textbooks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 학생 단원별 진도
CREATE TABLE naesin_student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES naesin_units(id) ON DELETE CASCADE,
  vocab_flashcard_count INTEGER NOT NULL DEFAULT 0,
  vocab_quiz_score INTEGER,
  vocab_spelling_score INTEGER,
  vocab_completed BOOLEAN NOT NULL DEFAULT false,
  passage_fill_blanks_best INTEGER,
  passage_ordering_best INTEGER,
  passage_completed BOOLEAN NOT NULL DEFAULT false,
  grammar_video_completed BOOLEAN NOT NULL DEFAULT false,
  grammar_text_read BOOLEAN NOT NULL DEFAULT false,
  grammar_completed BOOLEAN NOT NULL DEFAULT false,
  omr_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, unit_id)
);

-- OMR 제출 기록
CREATE TABLE naesin_omr_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  omr_sheet_id UUID NOT NULL REFERENCES naesin_omr_sheets(id) ON DELETE CASCADE,
  student_answers JSONB NOT NULL,
  correct_count INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  score_percent INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_naesin_textbooks_grade ON naesin_textbooks(grade);
CREATE INDEX idx_naesin_units_textbook ON naesin_units(textbook_id);
CREATE INDEX idx_naesin_units_sort ON naesin_units(textbook_id, sort_order);
CREATE INDEX idx_naesin_vocabulary_unit ON naesin_vocabulary(unit_id);
CREATE INDEX idx_naesin_vocabulary_sort ON naesin_vocabulary(unit_id, sort_order);
CREATE INDEX idx_naesin_passages_unit ON naesin_passages(unit_id);
CREATE INDEX idx_naesin_grammar_lessons_unit ON naesin_grammar_lessons(unit_id);
CREATE INDEX idx_naesin_omr_sheets_unit ON naesin_omr_sheets(unit_id);
CREATE INDEX idx_naesin_student_settings_student ON naesin_student_settings(student_id);
CREATE INDEX idx_naesin_student_progress_student ON naesin_student_progress(student_id);
CREATE INDEX idx_naesin_student_progress_unit ON naesin_student_progress(student_id, unit_id);
CREATE INDEX idx_naesin_omr_attempts_student ON naesin_omr_attempts(student_id);
CREATE INDEX idx_naesin_omr_attempts_sheet ON naesin_omr_attempts(omr_sheet_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE naesin_textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE naesin_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE naesin_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE naesin_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE naesin_grammar_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE naesin_omr_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE naesin_student_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE naesin_student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE naesin_omr_attempts ENABLE ROW LEVEL SECURITY;

-- Content tables: readable by all authenticated, manageable by teachers+
CREATE POLICY "Naesin textbooks: readable by authenticated" ON naesin_textbooks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Naesin textbooks: manageable by teachers+" ON naesin_textbooks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin', 'boss'))
  );

CREATE POLICY "Naesin units: readable by authenticated" ON naesin_units
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Naesin units: manageable by teachers+" ON naesin_units
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin', 'boss'))
  );

CREATE POLICY "Naesin vocabulary: readable by authenticated" ON naesin_vocabulary
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Naesin vocabulary: manageable by teachers+" ON naesin_vocabulary
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin', 'boss'))
  );

CREATE POLICY "Naesin passages: readable by authenticated" ON naesin_passages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Naesin passages: manageable by teachers+" ON naesin_passages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin', 'boss'))
  );

CREATE POLICY "Naesin grammar lessons: readable by authenticated" ON naesin_grammar_lessons
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Naesin grammar lessons: manageable by teachers+" ON naesin_grammar_lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin', 'boss'))
  );

CREATE POLICY "Naesin OMR sheets: readable by authenticated" ON naesin_omr_sheets
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Naesin OMR sheets: manageable by teachers+" ON naesin_omr_sheets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin', 'boss'))
  );

-- Student data: own data only, teachers can read same-academy
CREATE POLICY "Naesin student settings: own data" ON naesin_student_settings
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Naesin student progress: own data" ON naesin_student_progress
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Naesin student progress: teacher read" ON naesin_student_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS teacher
      JOIN users AS student ON student.id = naesin_student_progress.student_id
      WHERE teacher.id = auth.uid()
      AND teacher.role IN ('teacher', 'admin')
      AND teacher.academy_id = student.academy_id
    )
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'boss')
  );

CREATE POLICY "Naesin OMR attempts: own data" ON naesin_omr_attempts
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Naesin OMR attempts: teacher read" ON naesin_omr_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS teacher
      JOIN users AS student ON student.id = naesin_omr_attempts.student_id
      WHERE teacher.id = auth.uid()
      AND teacher.role IN ('teacher', 'admin')
      AND teacher.academy_id = student.academy_id
    )
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'boss')
  );

-- ============================================
-- Triggers
-- ============================================

CREATE TRIGGER update_naesin_student_settings_updated_at
  BEFORE UPDATE ON naesin_student_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_naesin_student_progress_updated_at
  BEFORE UPDATE ON naesin_student_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
