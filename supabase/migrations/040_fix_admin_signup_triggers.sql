-- ============================================
-- 040: 학원 원장 가입 DB 에러 수정
-- 원인 1: users INSERT 전에 academies INSERT → subscription 트리거의
--         created_by REFERENCES users(id) FK 위반
-- 원인 2: SECURITY DEFINER 함수에 SET search_path 누락
-- 원인 3: migration 030이 029의 free_service/max_students INSERT 제거 회귀
-- 추가: contact_number → academies.contact_phone 저장, 중복 입력 제거
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $fn$
DECLARE
  _academy_id UUID;
  _invite_code TEXT;
  _academy_name TEXT;
  _role TEXT;
  _full_name TEXT;
  _new_invite_code TEXT;
  _free_service TEXT;
  _phone TEXT;
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
  _phone := NEW.raw_user_meta_data->>'phone';

  IF _role = 'admin' AND _academy_name IS NOT NULL AND _academy_name != '' THEN
    INSERT INTO public.users (id, email, full_name, role, phone)
    VALUES (NEW.id, NEW.email, _full_name, _role::public.user_role, _phone);

    _new_invite_code := upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.academies (name, invite_code, owner_id, max_students, free_service, contact_phone)
    VALUES (_academy_name, _new_invite_code, NEW.id, 5, _free_service, _phone)
    RETURNING id INTO _academy_id;

    UPDATE public.users SET academy_id = _academy_id WHERE id = NEW.id;
  ELSE
    IF _invite_code IS NOT NULL AND _invite_code != '' THEN
      SELECT id INTO _academy_id FROM public.academies WHERE invite_code = _invite_code;
    END IF;

    INSERT INTO public.users (id, email, full_name, role, academy_id, phone)
    VALUES (NEW.id, NEW.email, _full_name, _role::public.user_role, _academy_id, _phone);
  END IF;

  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION auto_create_trial_subscription()
RETURNS TRIGGER AS $fn$
DECLARE
  _plan_id UUID;
BEGIN
  IF NEW.owner_id IS NULL THEN RETURN NEW; END IF;

  SELECT id INTO _plan_id FROM public.subscription_plans
  WHERE target = 'academy' AND is_active = true
  ORDER BY sort_order LIMIT 1;

  IF _plan_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.subscriptions (
    plan_id, academy_id, status, tier, customer_key,
    current_period_start, current_period_end, trial_end, created_by
  ) VALUES (
    _plan_id, NEW.id, 'active', 'free',
    'cust_' || replace(gen_random_uuid()::text, '-', ''),
    now(), now() + interval '7 days', now() + interval '7 days', NEW.owner_id
  );

  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION handle_new_student()
RETURNS TRIGGER AS $fn$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.student_settings (student_id)
    VALUES (NEW.id)
    ON CONFLICT (student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
