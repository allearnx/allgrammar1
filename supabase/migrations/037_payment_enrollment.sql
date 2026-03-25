-- ============================================
-- 037: 코스 결제 → 서비스 자동 활성화
-- ============================================

-- 1. orders 테이블에 course_id 추가
ALTER TABLE orders ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE SET NULL;

-- 2. service_assignments.source CHECK 제약 조건에 'payment' 추가
ALTER TABLE service_assignments DROP CONSTRAINT IF EXISTS service_assignments_source_check;
ALTER TABLE service_assignments ADD CONSTRAINT service_assignments_source_check
  CHECK (source IN ('manual', 'subscription', 'payment'));

-- 3. 학생 본인이 결제 시 service_assignments INSERT 허용
CREATE POLICY "students_insert_own_assignments"
  ON service_assignments FOR INSERT
  WITH CHECK (student_id = auth.uid());
