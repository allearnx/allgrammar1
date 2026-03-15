-- ============================================
-- 028: B2B 학원 설정 + 좌석 관리
-- ============================================

-- ── academies 테이블 확장 ──

ALTER TABLE academies ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS max_students INTEGER;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── 좌석 체크 함수 ──

CREATE OR REPLACE FUNCTION check_academy_seat_limit(_academy_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _max INTEGER;
  _current INTEGER;
BEGIN
  SELECT max_students INTO _max FROM academies WHERE id = _academy_id;
  IF _max IS NULL THEN RETURN TRUE; END IF;

  SELECT COUNT(*) INTO _current FROM users
  WHERE academy_id = _academy_id AND role = 'student' AND is_active = true;

  RETURN _current < _max;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RLS: admin이 자기 학원 UPDATE 가능 ──

CREATE POLICY "admin_update_own_academy"
  ON academies FOR UPDATE
  USING (
    get_my_role() = 'admin'
    AND id = get_my_academy_id()
  )
  WITH CHECK (
    get_my_role() = 'admin'
    AND id = get_my_academy_id()
  );
