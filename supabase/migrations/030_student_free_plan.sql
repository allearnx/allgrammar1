-- ============================================
-- 030: 학생 단독 가입 시 올킬보카 무료 자동 부여
-- (빌링 테이블 없이 service_assignments 직접 INSERT)
-- ============================================

-- 1. handle_new_user() 수정: search_path 설정 + user_role 캐스팅 수정
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
    _role::public.user_role,
    _academy_id,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 2. 독립 학생 voca 자동 배정 — users INSERT 트리거
CREATE OR REPLACE FUNCTION auto_assign_voca_for_independent_student()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.academy_id IS NULL THEN
    INSERT INTO public.service_assignments (student_id, service, assigned_by)
    VALUES (NEW.id, 'voca', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_assign_voca ON public.users;
CREATE TRIGGER trg_auto_assign_voca
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_voca_for_independent_student();
