-- ============================================
-- 올라영 AI 문법 마스터 - Phase 1 Database Schema
-- ============================================

-- Custom types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'boss');
CREATE TYPE memory_item_type AS ENUM ('vocabulary', 'sentence', 'grammar_rule');

-- ============================================
-- Tables
-- ============================================

-- Academies
CREATE TABLE academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users (linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  academy_id UUID REFERENCES academies(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Levels (1-30)
CREATE TABLE levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number INTEGER NOT NULL UNIQUE CHECK (level_number BETWEEN 1 AND 30),
  title TEXT NOT NULL,
  title_ko TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grammar topics per level
CREATE TABLE grammars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  youtube_video_id TEXT,
  video_duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Memory items (flashcard + quiz + spelling in one row)
CREATE TABLE memory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grammar_id UUID NOT NULL REFERENCES grammars(id) ON DELETE CASCADE,
  item_type memory_item_type NOT NULL DEFAULT 'vocabulary',
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  quiz_options JSONB,
  quiz_correct_index INTEGER,
  spelling_hint TEXT,
  spelling_answer TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student memory progress (spaced repetition tracking)
CREATE TABLE student_memory_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_item_id UUID NOT NULL REFERENCES memory_items(id) ON DELETE CASCADE,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  current_interval_days INTEGER NOT NULL DEFAULT 1,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  flashcard_seen BOOLEAN NOT NULL DEFAULT false,
  quiz_correct_count INTEGER NOT NULL DEFAULT 0,
  quiz_wrong_count INTEGER NOT NULL DEFAULT 0,
  spelling_correct_count INTEGER NOT NULL DEFAULT 0,
  spelling_wrong_count INTEGER NOT NULL DEFAULT 0,
  is_mastered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, memory_item_id)
);

-- Student video progress
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grammar_id UUID NOT NULL REFERENCES grammars(id) ON DELETE CASCADE,
  video_watched_seconds INTEGER NOT NULL DEFAULT 0,
  video_completed BOOLEAN NOT NULL DEFAULT false,
  video_last_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, grammar_id)
);

-- Textbook passages
CREATE TABLE textbook_passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grammar_id UUID NOT NULL REFERENCES grammars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_text TEXT NOT NULL,
  korean_translation TEXT NOT NULL,
  blanks_easy JSONB,
  blanks_medium JSONB,
  blanks_hard JSONB,
  sentences JSONB,
  is_textbook_mode_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student textbook progress
CREATE TABLE student_textbook_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  passage_id UUID NOT NULL REFERENCES textbook_passages(id) ON DELETE CASCADE,
  fill_blanks_easy_score REAL,
  fill_blanks_medium_score REAL,
  fill_blanks_hard_score REAL,
  fill_blanks_attempts INTEGER NOT NULL DEFAULT 0,
  ordering_score REAL,
  ordering_attempts INTEGER NOT NULL DEFAULT 0,
  translation_score REAL,
  translation_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, passage_id)
);

-- Exams
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student settings
CREATE TABLE student_settings (
  student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_review_limit INTEGER NOT NULL DEFAULT 50,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT NOT NULL DEFAULT 'ko' CHECK (language IN ('ko', 'en')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_users_academy ON users(academy_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_grammars_level ON grammars(level_id);
CREATE INDEX idx_grammars_sort ON grammars(level_id, sort_order);
CREATE INDEX idx_memory_items_grammar ON memory_items(grammar_id);
CREATE INDEX idx_memory_items_sort ON memory_items(grammar_id, sort_order);
CREATE INDEX idx_student_memory_progress_student ON student_memory_progress(student_id);
CREATE INDEX idx_student_memory_progress_review ON student_memory_progress(student_id, next_review_date);
CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_grammar ON student_progress(grammar_id);
CREATE INDEX idx_textbook_passages_grammar ON textbook_passages(grammar_id);
CREATE INDEX idx_student_textbook_progress_student ON student_textbook_progress(student_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammars ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_memory_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE textbook_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_textbook_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_settings ENABLE ROW LEVEL SECURITY;

-- Academies: readable by members, manageable by admin+
CREATE POLICY "Academies: readable by members" ON academies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.academy_id = academies.id)
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'boss')
  );

CREATE POLICY "Academies: manageable by boss" ON academies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'boss')
  );

-- Users: own profile or same academy teachers/admins
CREATE POLICY "Users: read own profile" ON users
  FOR SELECT USING (
    id = auth.uid()
    OR (
      EXISTS (
        SELECT 1 FROM users AS u
        WHERE u.id = auth.uid()
        AND u.role IN ('teacher', 'admin')
        AND u.academy_id = users.academy_id
      )
    )
    OR EXISTS (SELECT 1 FROM users AS u WHERE u.id = auth.uid() AND u.role = 'boss')
  );

CREATE POLICY "Users: update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users: insert own profile" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Levels & Grammars: readable by all authenticated users
CREATE POLICY "Levels: readable by authenticated" ON levels
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Levels: manageable by teachers+" ON levels
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin', 'boss'))
  );

CREATE POLICY "Grammars: readable by authenticated" ON grammars
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Grammars: manageable by teachers+" ON grammars
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin', 'boss'))
  );

-- Memory items: readable by all, manageable by teachers+
CREATE POLICY "Memory items: readable by authenticated" ON memory_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Memory items: manageable by teachers+" ON memory_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin', 'boss'))
  );

-- Student memory progress: own data only, teachers can read same-academy
CREATE POLICY "Memory progress: own data" ON student_memory_progress
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Memory progress: teacher read" ON student_memory_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS teacher
      JOIN users AS student ON student.id = student_memory_progress.student_id
      WHERE teacher.id = auth.uid()
      AND teacher.role IN ('teacher', 'admin')
      AND teacher.academy_id = student.academy_id
    )
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'boss')
  );

-- Student progress: own data only, teachers can read same-academy
CREATE POLICY "Student progress: own data" ON student_progress
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Student progress: teacher read" ON student_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS teacher
      JOIN users AS student ON student.id = student_progress.student_id
      WHERE teacher.id = auth.uid()
      AND teacher.role IN ('teacher', 'admin')
      AND teacher.academy_id = student.academy_id
    )
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'boss')
  );

-- Textbook passages: readable by all, manageable by teachers+
CREATE POLICY "Textbook passages: readable by authenticated" ON textbook_passages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Textbook passages: manageable by teachers+" ON textbook_passages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin', 'boss'))
  );

-- Student textbook progress: own data only, teachers can read
CREATE POLICY "Textbook progress: own data" ON student_textbook_progress
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Textbook progress: teacher read" ON student_textbook_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS teacher
      JOIN users AS student ON student.id = student_textbook_progress.student_id
      WHERE teacher.id = auth.uid()
      AND teacher.role IN ('teacher', 'admin')
      AND teacher.academy_id = student.academy_id
    )
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'boss')
  );

-- Exams: same academy
CREATE POLICY "Exams: same academy" ON exams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.academy_id = exams.academy_id
    )
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'boss')
  );

CREATE POLICY "Exams: manageable by teachers+" ON exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('teacher', 'admin', 'boss')
      AND users.academy_id = exams.academy_id
    )
  );

-- Student settings: own settings only
CREATE POLICY "Student settings: own data" ON student_settings
  FOR ALL USING (student_id = auth.uid());

-- ============================================
-- Functions
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_memory_progress_updated_at
  BEFORE UPDATE ON student_memory_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_student_progress_updated_at
  BEFORE UPDATE ON student_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_student_textbook_progress_updated_at
  BEFORE UPDATE ON student_textbook_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_student_settings_updated_at
  BEFORE UPDATE ON student_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-create student settings
CREATE OR REPLACE FUNCTION handle_new_student()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.student_settings (student_id)
    VALUES (NEW.id)
    ON CONFLICT (student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_settings
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_student();

-- ============================================
-- Seed data: 30 Levels
-- ============================================

INSERT INTO levels (level_number, title, title_ko) VALUES
  (1, 'Be Verb (am/is/are)', 'be동사 (am/is/are)'),
  (2, 'Be Verb Negative & Questions', 'be동사 부정문과 의문문'),
  (3, 'General Verbs (Present)', '일반동사 현재형'),
  (4, 'General Verbs Negative & Questions', '일반동사 부정문과 의문문'),
  (5, 'Present Progressive', '현재진행형'),
  (6, 'Past Tense (Be Verb)', '과거시제 (be동사)'),
  (7, 'Past Tense (General Verbs)', '과거시제 (일반동사)'),
  (8, 'Future Tense (will/be going to)', '미래시제'),
  (9, 'Modal Verbs (can/may/must)', '조동사'),
  (10, 'There is/There are', 'There is/There are 구문'),
  (11, 'Nouns & Articles', '명사와 관사'),
  (12, 'Pronouns', '대명사'),
  (13, 'Adjectives', '형용사'),
  (14, 'Adverbs', '부사'),
  (15, 'Prepositions', '전치사'),
  (16, 'Conjunctions', '접속사'),
  (17, 'Comparison (Comparative)', '비교급'),
  (18, 'Comparison (Superlative)', '최상급'),
  (19, 'Imperative Sentences', '명령문'),
  (20, 'Exclamatory Sentences', '감탄문'),
  (21, 'Sentence Patterns (1-3)', '문장의 형식 (1~3형식)'),
  (22, 'Sentence Patterns (4-5)', '문장의 형식 (4~5형식)'),
  (23, 'To-infinitive', 'to부정사'),
  (24, 'Gerund (-ing)', '동명사'),
  (25, 'Present Perfect', '현재완료'),
  (26, 'Passive Voice', '수동태'),
  (27, 'Relative Pronouns', '관계대명사'),
  (28, 'Indirect Speech', '간접화법'),
  (29, 'Conditional Sentences', '조건문 (if)'),
  (30, 'Review & Advanced Patterns', '총복습과 심화 패턴');
