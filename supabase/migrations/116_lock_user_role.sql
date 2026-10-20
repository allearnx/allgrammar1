-- ============================================
-- 116: users 권한 컬럼 잠금 — role 자가 변경·가입 시 boss 지정 차단
--
-- 문제 1: "Users: update own profile"(001)이 USING (id = auth.uid())만 있고
--         authenticated에 users UPDATE가 통째로 GRANT(088)돼 있어,
--         로그인한 누구나 REST로 자기 role='boss', academy_id, is_active를 바꿀 수 있었음.
-- 문제 2: handle_new_user()(040)가 가입 메타데이터의 role을 그대로 캐스팅 →
--         signUp API를 직접 부르면 boss로 가입 가능. admin + academy_name 없이
--         invite_code를 넣으면 기존 학원의 원장으로 들어감.
--
-- 앱에서 본인 행을 RLS 클라이언트로 고치는 곳은 없음 (presence·join-academy·
-- payment/confirm 모두 admin 클라이언트). 선생님 셀프 가입(invite_code)은 유지.
-- ============================================

-- 1. 본인 수정·추가 정책 제거 (본인 행은 가입 트리거·서버 admin 클라이언트만 씀)
DROP POLICY IF EXISTS "Users: update own profile" ON users;
DROP POLICY IF EXISTS "Users: insert own profile" ON users;

-- 2. 이중 잠금: API 사용자(authenticated/anon)는 boss가 아니면
--    role·academy_id·is_homepage_manager를 바꿀 수 없음.
--    SECURITY INVOKER여야 current_user가 호출자 역할을 가리킴
--    (service_role·가입 트리거(SECURITY DEFINER)·마이그레이션은 통과).
CREATE OR REPLACE FUNCTION protect_user_privileged_columns()
RETURNS TRIGGER AS $fn$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF public.get_my_role() = 'boss' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.academy_id IS DISTINCT FROM OLD.academy_id
     OR NEW.is_homepage_manager IS DISTINCT FROM OLD.is_homepage_manager THEN
    RAISE EXCEPTION 'role, academy_id, is_homepage_manager는 변경할 수 없습니다'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_user_privileged_columns ON users;
CREATE TRIGGER trg_protect_user_privileged_columns
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION protect_user_privileged_columns();

-- 3. 가입 트리거: role 허용 목록 (040 본문 그대로 + _role 검증만 추가)
--    student·teacher·admin만 허용, 그 외(boss 등)는 student.
--    admin은 새 학원 이름이 있을 때만 — 없으면 student.
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

  IF _role NOT IN ('student', 'teacher', 'admin') THEN
    _role := 'student';
  END IF;
  IF _role = 'admin' AND (_academy_name IS NULL OR _academy_name = '') THEN
    _role := 'student';
  END IF;

  IF _role = 'admin' THEN
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
