-- ============================================
-- 서술형 AI 채점 로그 + 선생님 검수
-- ============================================
-- 배경: 내신 서술형이 문자열 비교(정규화)로만 채점되어 의미가 맞아도 표현이
-- 다르면 오답 처리됨. grade-subjective 라우트에 AI 채점 엔진(src/lib/grading/)을
-- 연결하면서, AI가 판정한 건을 전부 기록해 선생님이 검수·교정할 수 있게 한다.
-- 교정 데이터는 채점 정확도 검증 자산 (향후 IELTS Writing 채점의 기반).

CREATE TABLE IF NOT EXISTS subjective_grading_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sheet_id UUID,                          -- naesin_problem_sheets 참조 (시트 삭제돼도 로그 유지 위해 FK 없음)
  question_number INT,
  question TEXT NOT NULL,
  reference_answer TEXT NOT NULL,
  student_answer TEXT NOT NULL,
  ai_score INT NOT NULL,                  -- 0 | 50 | 100
  ai_feedback TEXT,
  corrected_answer TEXT,
  grading_method TEXT NOT NULL DEFAULT 'ai',  -- 'ai' | 'fallback' (exact 일치는 기록 안 함)
  teacher_score INT,                      -- 선생님 교정 점수 (NULL = 미검수)
  teacher_feedback TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subjective_grading_logs_created
  ON subjective_grading_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subjective_grading_logs_unreviewed
  ON subjective_grading_logs (created_at DESC) WHERE reviewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_subjective_grading_logs_user
  ON subjective_grading_logs (user_id);

ALTER TABLE subjective_grading_logs ENABLE ROW LEVEL SECURITY;

-- 학생: 자기 로그 생성 (채점 라우트가 사용자 클라이언트로 insert)
DROP POLICY IF EXISTS "students_insert_own_grading_logs" ON subjective_grading_logs;
CREATE POLICY "students_insert_own_grading_logs"
  ON subjective_grading_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 학생: 자기 로그 읽기 (추후 "내 서술형 피드백" 화면 대비)
DROP POLICY IF EXISTS "students_read_own_grading_logs" ON subjective_grading_logs;
CREATE POLICY "students_read_own_grading_logs"
  ON subjective_grading_logs FOR SELECT
  USING (user_id = auth.uid());

-- 스태프: 내신 관리 권한 기준 전체 읽기 + 검수(교정) 쓰기 — 103의 게이트 재사용
DROP POLICY IF EXISTS "staff_read_grading_logs" ON subjective_grading_logs;
CREATE POLICY "staff_read_grading_logs"
  ON subjective_grading_logs FOR SELECT
  USING (naesin_manage_allowed());

DROP POLICY IF EXISTS "staff_review_grading_logs" ON subjective_grading_logs;
CREATE POLICY "staff_review_grading_logs"
  ON subjective_grading_logs FOR UPDATE
  USING (naesin_manage_allowed())
  WITH CHECK (naesin_manage_allowed());

-- 명시 GRANT (088 습관)
GRANT SELECT, INSERT, UPDATE ON subjective_grading_logs TO authenticated;
GRANT ALL ON subjective_grading_logs TO service_role;
