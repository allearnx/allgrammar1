-- 041: sync_subscription_services — free tier 학원은 서비스 자동배정 스킵
-- free tier 학원 학생은 직접 택1 선택하므로, sync에서 INSERT를 건너뛴다.
-- paid/trialing 학원은 기존대로 전체 서비스 배정.

CREATE OR REPLACE FUNCTION sync_subscription_services(sub_id UUID)
RETURNS VOID AS $$
DECLARE
  _sub RECORD;
  _plan RECORD;
  _service TEXT;
  _student RECORD;
BEGIN
  SET search_path = public;

  SELECT * INTO _sub FROM subscriptions WHERE id = sub_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT * INTO _plan FROM subscription_plans WHERE id = _sub.plan_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF _sub.status IN ('trialing', 'active', 'past_due') THEN
    -- free tier: 학생이 직접 선택하므로 자동배정 스킵
    IF _sub.tier = 'free' THEN
      RETURN;
    END IF;

    -- paid/trialing: 서비스 부여
    IF _sub.academy_id IS NOT NULL THEN
      FOR _student IN
        SELECT id FROM users
        WHERE academy_id = _sub.academy_id AND role = 'student' AND is_active = true
      LOOP
        FOREACH _service IN ARRAY _plan.services LOOP
          INSERT INTO service_assignments (student_id, service, assigned_by, source, subscription_id)
          VALUES (_student.id, _service, _sub.created_by, 'subscription', _sub.id)
          ON CONFLICT (student_id, service) DO UPDATE
          SET source = 'subscription', subscription_id = _sub.id;
        END LOOP;
      END LOOP;
    ELSE
      FOREACH _service IN ARRAY _plan.services LOOP
        INSERT INTO service_assignments (student_id, service, assigned_by, source, subscription_id)
        VALUES (_sub.student_id, _service, _sub.created_by, 'subscription', _sub.id)
        ON CONFLICT (student_id, service) DO UPDATE
        SET source = 'subscription', subscription_id = _sub.id;
      END LOOP;
    END IF;
  ELSIF _sub.status IN ('canceled', 'expired') THEN
    -- 구독 서비스만 회수 (수동 배정 보존)
    DELETE FROM service_assignments
    WHERE subscription_id = _sub.id AND source = 'subscription';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
