-- 014_grammar_socratic_chat.sql
-- 소크라틱 AI 문법 챗봇: 레슨별 질문 세팅 + 학생 대화 세션

-- ============================================
-- naesin_grammar_chat_questions: 선생님이 미리 세팅하는 질문
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_grammar_chat_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES naesin_grammar_lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  grammar_concept TEXT,
  hint TEXT,
  expected_answer_keywords TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE naesin_grammar_chat_questions ENABLE ROW LEVEL SECURITY;

-- Everyone can read questions
CREATE POLICY "Anyone can read chat questions"
  ON naesin_grammar_chat_questions FOR SELECT
  USING (true);

-- Teachers/admin/boss can manage questions
CREATE POLICY "Teachers can manage chat questions"
  ON naesin_grammar_chat_questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- ============================================
-- naesin_grammar_chat_sessions: 학생 대화 이력
-- ============================================
CREATE TABLE IF NOT EXISTS naesin_grammar_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES naesin_grammar_lessons(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  turn_count INTEGER DEFAULT 0,
  max_turns INTEGER DEFAULT 5,
  is_complete BOOLEAN DEFAULT false,
  current_question_id UUID REFERENCES naesin_grammar_chat_questions(id) ON DELETE SET NULL,
  questions_used UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE naesin_grammar_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Students can read/manage their own sessions
CREATE POLICY "Students can manage own chat sessions"
  ON naesin_grammar_chat_sessions FOR ALL
  USING (student_id = auth.uid());

-- Teachers can view all sessions
CREATE POLICY "Teachers can view chat sessions"
  ON naesin_grammar_chat_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'boss')
  ));

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_naesin_grammar_chat_questions_lesson
  ON naesin_grammar_chat_questions(lesson_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_naesin_grammar_chat_sessions_student_lesson
  ON naesin_grammar_chat_sessions(student_id, lesson_id);
