-- ============================================
-- 030: 학생 단독 가입 시 올킬보카 무료 자동 부여
-- (빌링 테이블 없이 service_assignments 직접 INSERT)
-- ============================================

-- handle_new_user() 수정: 독립 학생에게 voca 서비스 자동 배정
-- 기반: 026 버전 (phone 포함)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _academy_id UUID;
  _invite_code TEXT;
  _academy_name TEXT;
  _role TEXT;
  _full_name TEXT;
  _new_invite_code TEXT;
BEGIN
  _invite_code := NEW.raw_user_meta_data->>'invite_code';
  _academy_name := NEW.raw_user_meta_data->>'academy_name';
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );

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
    _full_name,
    COALESCE(_role::user_role, 'student'),
    _academy_id,
    NEW.raw_user_meta_data->>'phone'
  );

  -- 독립 학생(초대 코드 없음, 학원 없음): 올킬보카 자동 배정
  IF _role = 'student' AND _academy_id IS NULL THEN
    INSERT INTO public.service_assignments (student_id, service, assigned_by)
    VALUES (NEW.id, 'voca', NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
