-- ============================================
-- 120: 올라운더 HQ 1-2 — 반 · 입퇴원 이력 · 휴강일
--
-- 운영 화면은 별도 앱(allrounder-hq)이 같은 DB·로그인으로 쓴다. 학생은 기존 users(role=student)를
-- 참조하고 복사하지 않는다.
-- - classes: 반. weekdays = 수업 요일(EXTRACT(DOW): 0=일 … 6=토), sessions_per_cycle = 결제 1회당 수업 수(월 4회).
-- - class_enrollments: 입퇴원 이력. 반 이동 = 이전 행 닫기(end_reason='transferred') + 새 행 열기.
-- - class_closures: 휴강일. class_id NULL = 학원 전체(공휴일 등). 다음 결제일 계산(1-4)에서 수업일로 세지 않는다.
-- 읽기: 같은 학원 teacher·admin + boss. 쓰기: 같은 학원 admin + boss.
-- 모든 문항 idempotent (IF NOT EXISTS / DROP IF EXISTS).
-- ============================================

-- ── classes ──
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  department TEXT NOT NULL CHECK (department IN ('voca', 'naesin')),
  homeroom_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  weekdays SMALLINT[] NOT NULL DEFAULT '{}'
    CHECK (weekdays <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::SMALLINT[]),
  sessions_per_cycle SMALLINT NOT NULL DEFAULT 4 CHECK (sessions_per_cycle BETWEEN 1 AND 31),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classes_academy ON classes(academy_id);

DROP TRIGGER IF EXISTS trg_classes_updated_at ON classes;
CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── class_enrollments ──
CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  end_reason TEXT CHECK (end_reason IN ('withdrawn', 'transferred', 'completed')),
  note TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT class_enrollments_end_after_start CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT class_enrollments_end_reason_pair CHECK ((end_date IS NULL) = (end_reason IS NULL))
);

-- 한 학생은 같은 반에 열린(재원 중) 행을 하나만 가진다
CREATE UNIQUE INDEX IF NOT EXISTS uq_class_enrollments_open
  ON class_enrollments(student_id, class_id) WHERE end_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_academy ON class_enrollments(academy_id);

-- ── class_closures ──
CREATE TABLE IF NOT EXISTS class_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  closed_on DATE NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT class_closures_unique UNIQUE NULLS NOT DISTINCT (academy_id, class_id, closed_on)
);

CREATE INDEX IF NOT EXISTS idx_class_closures_academy_date ON class_closures(academy_id, closed_on);

-- ── 소속 일관성: 행의 academy_id는 반의 학원, 학생은 그 학원의 student ──
-- SECURITY DEFINER: 호출자 RLS와 무관하게 반·학생을 확인 (검사만 하고 권한은 주지 않음).
CREATE OR REPLACE FUNCTION hq_enforce_class_academy()
RETURNS TRIGGER AS $fn$
DECLARE
  _class_academy UUID;
BEGIN
  IF NEW.class_id IS NOT NULL THEN
    SELECT academy_id INTO _class_academy FROM public.classes WHERE id = NEW.class_id;
    IF _class_academy IS NULL THEN
      RAISE EXCEPTION '반을 찾을 수 없습니다' USING ERRCODE = '23503';
    END IF;
    NEW.academy_id := _class_academy;
  END IF;

  IF TG_TABLE_NAME = 'class_enrollments' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = NEW.student_id AND role = 'student' AND academy_id = NEW.academy_id
    ) THEN
      RAISE EXCEPTION '같은 학원의 학생만 반에 배정할 수 있습니다' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trg_class_enrollments_academy ON class_enrollments;
CREATE TRIGGER trg_class_enrollments_academy
  BEFORE INSERT OR UPDATE OF class_id, student_id, academy_id ON class_enrollments
  FOR EACH ROW EXECUTE FUNCTION hq_enforce_class_academy();

DROP TRIGGER IF EXISTS trg_class_closures_academy ON class_closures;
CREATE TRIGGER trg_class_closures_academy
  BEFORE INSERT OR UPDATE OF class_id, academy_id ON class_closures
  FOR EACH ROW EXECUTE FUNCTION hq_enforce_class_academy();

-- ── RLS ──
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_closures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS classes_staff_read_academy ON classes;
CREATE POLICY classes_staff_read_academy ON classes FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (get_my_role() IN ('teacher', 'admin') AND academy_id = get_my_academy_id())
  );

DROP POLICY IF EXISTS classes_admin_manage_academy ON classes;
CREATE POLICY classes_admin_manage_academy ON classes FOR ALL
  USING (
    get_my_role() = 'boss'
    OR (get_my_role() = 'admin' AND academy_id = get_my_academy_id())
  );

DROP POLICY IF EXISTS class_enrollments_staff_read_academy ON class_enrollments;
CREATE POLICY class_enrollments_staff_read_academy ON class_enrollments FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (get_my_role() IN ('teacher', 'admin') AND academy_id = get_my_academy_id())
  );

DROP POLICY IF EXISTS class_enrollments_admin_manage_academy ON class_enrollments;
CREATE POLICY class_enrollments_admin_manage_academy ON class_enrollments FOR ALL
  USING (
    get_my_role() = 'boss'
    OR (get_my_role() = 'admin' AND academy_id = get_my_academy_id())
  );

DROP POLICY IF EXISTS class_closures_staff_read_academy ON class_closures;
CREATE POLICY class_closures_staff_read_academy ON class_closures FOR SELECT
  USING (
    get_my_role() = 'boss'
    OR (get_my_role() IN ('teacher', 'admin') AND academy_id = get_my_academy_id())
  );

DROP POLICY IF EXISTS class_closures_admin_manage_academy ON class_closures;
CREATE POLICY class_closures_admin_manage_academy ON class_closures FOR ALL
  USING (
    get_my_role() = 'boss'
    OR (get_my_role() = 'admin' AND academy_id = get_my_academy_id())
  );

-- ── 반 이동: 이전 행 닫기 + 새 행 열기를 한 트랜잭션으로 ──
-- SECURITY INVOKER: 호출자의 RLS(같은 학원 admin·boss)가 그대로 적용된다.
CREATE OR REPLACE FUNCTION hq_transfer_enrollment(p_enrollment_id UUID, p_new_class_id UUID, p_on DATE)
RETURNS UUID AS $fn$
DECLARE
  _e class_enrollments%ROWTYPE;
  _updated INT;
  _new_id UUID;
BEGIN
  SELECT * INTO _e FROM class_enrollments
  WHERE id = p_enrollment_id AND end_date IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION '재원 중인 배정을 찾을 수 없습니다' USING ERRCODE = 'P0002';
  END IF;
  IF p_new_class_id = _e.class_id THEN
    RAISE EXCEPTION '같은 반으로는 옮길 수 없습니다' USING ERRCODE = '22023';
  END IF;

  UPDATE class_enrollments SET end_date = p_on, end_reason = 'transferred'
  WHERE id = p_enrollment_id;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated <> 1 THEN
    RAISE EXCEPTION '반 이동 권한이 없습니다' USING ERRCODE = '42501';
  END IF;

  INSERT INTO class_enrollments (academy_id, class_id, student_id, start_date, created_by)
  VALUES (_e.academy_id, p_new_class_id, _e.student_id, p_on, auth.uid())
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$fn$ LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public;

REVOKE EXECUTE ON FUNCTION hq_transfer_enrollment(UUID, UUID, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION hq_transfer_enrollment(UUID, UUID, DATE) TO authenticated;

-- ── GRANT (088 원칙: authenticated만, service_role은 기본 전체) ──
GRANT SELECT, INSERT, UPDATE, DELETE ON classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON class_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON class_closures TO authenticated;
