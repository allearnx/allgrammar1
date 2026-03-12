-- ── users 테이블에 phone 컬럼 추가 ──
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- ── handle_new_user() 수정: phone 저장 ──

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

  INSERT INTO public.users (id, email, full_name, role, academy_id, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(_role::user_role, 'student'),
    _academy_id,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
