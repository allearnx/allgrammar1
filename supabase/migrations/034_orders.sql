-- ============================================
-- 034: 단건 결제 (One-time Payment) 주문 테이블
-- ============================================

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'canceled');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  toss_order_id TEXT NOT NULL UNIQUE,
  toss_payment_key TEXT,
  receipt_url TEXT,
  failure_code TEXT,
  failure_message TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_orders_user ON orders(user_id);

-- 본인 주문 조회
CREATE POLICY "read_own_orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

-- boss 전체 관리
CREATE POLICY "boss_manage_orders"
  ON orders FOR ALL
  USING (get_my_role() = 'boss');

-- 본인 주문 생성 (API에서 user_id = auth.uid()로 insert)
CREATE POLICY "insert_own_orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 본인 주문 상태 업데이트
CREATE POLICY "update_own_orders"
  ON orders FOR UPDATE
  USING (user_id = auth.uid());
