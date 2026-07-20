-- ============================================
-- 098: 공개 요금제 페이지 anon 조회 허용
--   /pricing은 비로그인 학원장이 보는 공개 페이지인데 subscription_plans에
--   anon 정책/GRANT가 없어 플랜 카드가 빈 채로 렌더되던 버그 (2026-07-20 발견).
--   활성 플랜만 공개 — 가격은 어차피 공개 정보.
-- ============================================

GRANT SELECT ON subscription_plans TO anon;

DROP POLICY IF EXISTS "anon_read_active_plans" ON subscription_plans;
CREATE POLICY "anon_read_active_plans"
  ON subscription_plans FOR SELECT
  TO anon
  USING (is_active = true);
