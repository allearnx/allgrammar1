-- 학생별 보카 교재 배정 (학생당 1개)
CREATE TABLE voca_book_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES voca_books(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE voca_book_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_read_own_book_assignment"
  ON voca_book_assignments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "boss_admin_manage_book_assignments"
  ON voca_book_assignments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('boss','admin'))
  );

CREATE INDEX idx_voca_book_assignments_student ON voca_book_assignments(student_id);
