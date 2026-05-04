-- 올킬오답: 보카 오답 정복 진행 상태
CREATE TABLE IF NOT EXISTS voca_wrong_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,                -- 해당 주 월요일
  total_words INT NOT NULL DEFAULT 0,
  graduated_count INT NOT NULL DEFAULT 0,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { "word": consecutive_correct_count }
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, week_start)
);

CREATE INDEX idx_voca_wrong_review_lookup ON voca_wrong_review(student_id, week_start);

ALTER TABLE voca_wrong_review ENABLE ROW LEVEL SECURITY;

-- 학생: 본인 데이터 전체 권한
CREATE POLICY "voca_wrong_review_own" ON voca_wrong_review
  FOR ALL USING (student_id = auth.uid());

-- boss: 전체 조회
CREATE POLICY "voca_wrong_review_boss" ON voca_wrong_review
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'boss')
  );

-- teacher/admin: 같은 학원 학생만 조회
CREATE POLICY "voca_wrong_review_staff_academy" ON voca_wrong_review
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users AS staff
      JOIN users AS student ON student.id = voca_wrong_review.student_id
      WHERE staff.id = auth.uid()
        AND staff.role IN ('teacher', 'admin')
        AND staff.academy_id = student.academy_id
    )
  );
