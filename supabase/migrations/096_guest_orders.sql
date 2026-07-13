-- ============================================
-- 089: 게스트(비로그인) 결제 지원
--   결제만 하고 앱은 안 쓰는 고객을 위해 로그인 없이 결제 가능하게.
--   주문은 계정 대신 이름+휴대폰으로 식별. 앱 접근(service_assignments)은 부여하지 않음.
-- ============================================

-- 1. user_id를 nullable로 (게스트 주문은 계정이 없음)
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- 2. 게스트 식별 필드
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- 3. 로그인 주문이면 user_id, 게스트 주문이면 이름+휴대폰이 반드시 있어야 함
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_or_guest_chk') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_user_or_guest_chk
      CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_phone IS NOT NULL));
  END IF;
END $$;

-- 참고: 게스트 주문 INSERT는 서버(서비스 롤, admin 클라이언트)에서만 수행한다.
--   anon 역할에는 orders 권한을 주지 않는다(직접 위조 INSERT 방지). RLS의 boss 정책은
--   user_id IS NULL 행도 포함하므로 boss는 게스트 주문을 그대로 조회 가능.
