-- ============================================
-- 025: B2B + 결제 시스템 (토스페이먼츠)
-- ============================================

-- ── ENUM 타입 ──

CREATE TYPE plan_target AS ENUM ('academy', 'individual');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'expired');
CREATE TYPE payment_status AS ENUM ('success', 'failed', 'refunded');

-- ── 요금제 테이블 ──

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target plan_target NOT NULL,
  services TEXT[] NOT NULL,
  price_per_unit INTEGER NOT NULL,
  min_students INTEGER,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_plans"
  ON subscription_plans FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "boss_manage_plans"
  ON subscription_plans FOR ALL
  USING (get_my_role() = 'boss');

-- ── 학원에 소유자 추가 ──

ALTER TABLE academies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

-- ── 구독 테이블 ──

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'trialing',
  billing_key TEXT,
  customer_key TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  grace_period_end TIMESTAMPTZ,
  failed_payment_count INTEGER NOT NULL DEFAULT 0,
  canceled_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (academy_id IS NOT NULL AND student_id IS NULL) OR
    (academy_id IS NULL AND student_id IS NOT NULL)
  )
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_subscriptions_academy ON subscriptions(academy_id);
CREATE INDEX idx_subscriptions_student ON subscriptions(student_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 본인/소속학원/boss 읽기
CREATE POLICY "read_own_subscriptions"
  ON subscriptions FOR SELECT
  USING (
    created_by = auth.uid()
    OR student_id = auth.uid()
    OR academy_id = get_my_academy_id()
    OR get_my_role() = 'boss'
  );

-- boss 전체 관리
CREATE POLICY "boss_manage_subscriptions"
  ON subscriptions FOR ALL
  USING (get_my_role() = 'boss');

-- admin(owner) 본인 학원 구독 관리
CREATE POLICY "admin_manage_own_academy_subscriptions"
  ON subscriptions FOR ALL
  USING (
    get_my_role() = 'admin'
    AND academy_id = get_my_academy_id()
  );

-- ── 결제 내역 테이블 ──

CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  toss_payment_key TEXT,
  toss_order_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status payment_status NOT NULL,
  failure_code TEXT,
  failure_message TEXT,
  receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payment_history_subscription ON payment_history(subscription_id);

-- 구독 소유자/boss 읽기
CREATE POLICY "read_own_payment_history"
  ON payment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = payment_history.subscription_id
      AND (
        s.created_by = auth.uid()
        OR s.student_id = auth.uid()
        OR s.academy_id = get_my_academy_id()
        OR get_my_role() = 'boss'
      )
    )
  );

CREATE POLICY "boss_manage_payment_history"
  ON payment_history FOR ALL
  USING (get_my_role() = 'boss');

-- service role로 insert 허용 (cron job용)
CREATE POLICY "service_insert_payment_history"
  ON payment_history FOR INSERT
  WITH CHECK (true);

-- ── service_assignments에 출처 추적 컬럼 추가 ──

ALTER TABLE service_assignments ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'subscription'));
ALTER TABLE service_assignments ADD COLUMN IF NOT EXISTS subscription_id UUID
  REFERENCES subscriptions(id) ON DELETE SET NULL;

-- ── sync_subscription_services 함수 ──

CREATE OR REPLACE FUNCTION sync_subscription_services(sub_id UUID)
RETURNS VOID AS $$
DECLARE
  _sub RECORD;
  _plan RECORD;
  _service TEXT;
  _student RECORD;
BEGIN
  SELECT * INTO _sub FROM subscriptions WHERE id = sub_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT * INTO _plan FROM subscription_plans WHERE id = _sub.plan_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF _sub.status IN ('trialing', 'active', 'past_due') THEN
    -- 서비스 부여
    IF _sub.academy_id IS NOT NULL THEN
      -- 학원 구독: 해당 학원의 모든 활성 학생
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
      -- 개인 구독: 해당 학생에게만
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── handle_new_user() 수정: admin + academy_name 시 학원 자동 생성 ──

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _academy_id UUID;
  _invite_code TEXT;
  _academy_name TEXT;
  _role TEXT;
  _new_invite_code TEXT;
BEGIN
  _invite_code := NEW.raw_user_meta_data->>'invite_code';
  _academy_name := NEW.raw_user_meta_data->>'academy_name';
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  -- admin + academy_name: 학원 자동 생성
  IF _role = 'admin' AND _academy_name IS NOT NULL AND _academy_name != '' THEN
    _new_invite_code := upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.academies (name, invite_code, owner_id)
    VALUES (_academy_name, _new_invite_code, NEW.id)
    RETURNING id INTO _academy_id;
  ELSIF _invite_code IS NOT NULL AND _invite_code != '' THEN
    SELECT id INTO _academy_id FROM public.academies WHERE invite_code = _invite_code;
  END IF;

  INSERT INTO public.users (id, email, full_name, role, academy_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(_role::user_role, 'student'),
    _academy_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 학원 생성 시 트라이얼 구독 자동 생성 트리거 ──

CREATE OR REPLACE FUNCTION auto_create_trial_subscription()
RETURNS TRIGGER AS $$
DECLARE
  _plan_id UUID;
BEGIN
  -- owner_id가 있는 새 학원에만 적용 (자가 가입)
  IF NEW.owner_id IS NULL THEN RETURN NEW; END IF;

  -- 기본 학원 플랜 가져오기
  SELECT id INTO _plan_id FROM subscription_plans
  WHERE target = 'academy' AND is_active = true
  ORDER BY sort_order LIMIT 1;

  IF _plan_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO subscriptions (
    plan_id, academy_id, status, customer_key,
    current_period_start, current_period_end, trial_end, created_by
  ) VALUES (
    _plan_id, NEW.id, 'trialing',
    'cust_' || replace(gen_random_uuid()::text, '-', ''),
    now(), now() + interval '7 days', now() + interval '7 days', NEW.owner_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_create_trial_subscription
  AFTER INSERT ON academies
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_trial_subscription();

-- ── 학생 학원 합류 시 구독 서비스 자동 부여 ──

CREATE OR REPLACE FUNCTION on_student_joins_academy()
RETURNS TRIGGER AS $$
DECLARE
  _sub RECORD;
BEGIN
  -- academy_id가 변경된 학생에 대해서만 실행
  IF NEW.academy_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.role != 'student' THEN RETURN NEW; END IF;
  IF OLD.academy_id IS NOT DISTINCT FROM NEW.academy_id THEN RETURN NEW; END IF;

  -- 해당 학원의 활성 구독 서비스 부여
  FOR _sub IN
    SELECT id FROM subscriptions
    WHERE academy_id = NEW.academy_id
    AND status IN ('trialing', 'active', 'past_due')
  LOOP
    PERFORM sync_subscription_services(_sub.id);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_student_joins_academy
  AFTER UPDATE OF academy_id ON users
  FOR EACH ROW
  EXECUTE FUNCTION on_student_joins_academy();

-- ── 구독 상태 변경 시 서비스 동기화 트리거 ──

CREATE OR REPLACE FUNCTION on_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM sync_subscription_services(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_subscription_status_change
  AFTER UPDATE OF status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION on_subscription_status_change();
