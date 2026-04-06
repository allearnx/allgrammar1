-- ============================================
-- 060: SECURITY DEFINER 함수 search_path 누락 수정
-- search_path 공격을 방지하기 위해 모든 SECURITY DEFINER 함수에
-- SET search_path = public 추가
-- ============================================

-- 1) on_student_joins_academy (원본: 025)
CREATE OR REPLACE FUNCTION on_student_joins_academy()
RETURNS TRIGGER AS $$
DECLARE
  _sub RECORD;
BEGIN
  IF NEW.academy_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.role != 'student' THEN RETURN NEW; END IF;
  IF OLD.academy_id IS NOT DISTINCT FROM NEW.academy_id THEN RETURN NEW; END IF;

  FOR _sub IN
    SELECT id FROM subscriptions
    WHERE academy_id = NEW.academy_id
    AND status IN ('trialing', 'active', 'past_due')
  LOOP
    PERFORM sync_subscription_services(_sub.id);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 2) on_subscription_status_change (원본: 025)
CREATE OR REPLACE FUNCTION on_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM sync_subscription_services(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 3) check_academy_seat_limit (원본: 028)
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
