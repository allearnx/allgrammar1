-- ============================================
-- 030: 학생 단독 가입 시 올킬보카 무료 플랜 자동 부여
-- ============================================

-- ── 1. 개인 무료 플랜 생성 ──
INSERT INTO subscription_plans (name, target, services, price_per_unit, description, sort_order)
VALUES ('올킬보카 무료', 'individual', '{voca}', 0, '1회독 무료 플랜', 100);

-- ── 2. handle_new_user() 수정: 독립 학생에게 무료 구독 자동 부여 ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _academy_id UUID;
  _invite_code TEXT;
  _academy_name TEXT;
  _role TEXT;
  _full_name TEXT;
  _new_invite_code TEXT;
  _free_service TEXT;
  _ind_plan_id UUID;
  _new_sub_id UUID;
BEGIN
  _invite_code := NEW.raw_user_meta_data->>'invite_code';
  _academy_name := NEW.raw_user_meta_data->>'academy_name';
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );
  _free_service := NEW.raw_user_meta_data->>'free_service';

  -- admin + academy_name: 학원 자동 생성
  IF _role = 'admin' AND _academy_name IS NOT NULL AND _academy_name != '' THEN
    _new_invite_code := upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.academies (name, invite_code, owner_id, max_students, free_service)
    VALUES (_academy_name, _new_invite_code, NEW.id, 5, _free_service)
    RETURNING id INTO _academy_id;
  ELSIF _invite_code IS NOT NULL AND _invite_code != '' THEN
    SELECT id INTO _academy_id FROM public.academies WHERE invite_code = _invite_code;
  END IF;

  INSERT INTO public.users (id, email, full_name, role, academy_id, phone)
  VALUES (
    NEW.id,
    NEW.email,
    _full_name,
    COALESCE(_role::user_role, 'student'),
    _academy_id,
    NEW.raw_user_meta_data->>'phone'
  );

  -- 독립 학생(초대 코드 없음, 학원 없음): 올킬보카 무료 구독 자동 부여
  IF _role = 'student' AND _academy_id IS NULL THEN
    SELECT id INTO _ind_plan_id FROM subscription_plans
    WHERE target = 'individual' AND is_active = true
    ORDER BY sort_order LIMIT 1;

    IF _ind_plan_id IS NOT NULL THEN
      INSERT INTO subscriptions (
        plan_id, student_id, status, tier, customer_key,
        current_period_start, current_period_end, created_by
      ) VALUES (
        _ind_plan_id, NEW.id, 'active', 'free',
        'cust_' || replace(gen_random_uuid()::text, '-', ''),
        now(), now() + interval '100 years', NEW.id
      ) RETURNING id INTO _new_sub_id;

      PERFORM sync_subscription_services(_new_sub_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
