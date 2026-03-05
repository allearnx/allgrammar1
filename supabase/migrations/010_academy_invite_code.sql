-- academies 테이블에 invite_code 컬럼 추가
ALTER TABLE academies ADD COLUMN invite_code TEXT UNIQUE;

-- 기존 학원에 코드 부여
UPDATE academies SET invite_code = upper(substr(md5(random()::text), 1, 6))
WHERE invite_code IS NULL;

ALTER TABLE academies ALTER COLUMN invite_code SET NOT NULL;

-- handle_new_user() 수정: raw_user_meta_data.invite_code → academy_id 자동 매핑
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _academy_id UUID;
  _invite_code TEXT;
BEGIN
  _invite_code := NEW.raw_user_meta_data->>'invite_code';
  IF _invite_code IS NOT NULL AND _invite_code != '' THEN
    SELECT id INTO _academy_id FROM public.academies WHERE invite_code = _invite_code;
  END IF;

  INSERT INTO public.users (id, email, full_name, role, academy_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    _academy_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
