-- 학습자료 PDF 업로드/다운로드
CREATE TABLE learning_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  academy_id UUID REFERENCES academies(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;

-- Boss: 전체 CRUD
CREATE POLICY "boss_all" ON learning_materials
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'boss')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'boss')
  );

-- Teacher/Admin: 같은 학원 자료 관리
CREATE POLICY "teacher_admin_manage" ON learning_materials
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
        AND role IN ('teacher', 'admin')
        AND academy_id IS NOT NULL
        AND academy_id = learning_materials.academy_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
        AND role IN ('teacher', 'admin')
        AND academy_id IS NOT NULL
        AND academy_id = learning_materials.academy_id
    )
  );

-- Student: 자기 학원 자료 + 전체 공개(boss) 자료 읽기
CREATE POLICY "student_read" ON learning_materials
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
        AND role = 'student'
        AND (
          learning_materials.academy_id IS NULL
          OR academy_id = learning_materials.academy_id
        )
    )
  );

-- Teacher/Admin: 전체 공개(boss) 자료도 읽기
CREATE POLICY "teacher_admin_read_global" ON learning_materials
  FOR SELECT TO authenticated
  USING (
    learning_materials.academy_id IS NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = (SELECT auth.uid())
        AND role IN ('teacher', 'admin')
    )
  );

CREATE INDEX idx_learning_materials_academy ON learning_materials(academy_id);
CREATE INDEX idx_learning_materials_uploaded_by ON learning_materials(uploaded_by);
