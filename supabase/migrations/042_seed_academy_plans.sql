-- 042: subscription_plans 시드 데이터 — 학원 요금제 5개
-- 무료 플랜 sort_order=0 → auto_create_trial_subscription()이 자동 선택
-- 중복 방지: 이미 있는 플랜은 건너뜀

INSERT INTO subscription_plans (name, target, services, price_per_unit, min_students, sort_order, is_active)
SELECT '무료', 'academy', ARRAY['naesin','voca'], 0, 5, 0, true
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = '무료' AND target = 'academy');

INSERT INTO subscription_plans (name, target, services, price_per_unit, min_students, sort_order, is_active)
SELECT 'Pro 8', 'academy', ARRAY['naesin','voca'], 28000, 8, 1, true
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Pro 8' AND target = 'academy');

INSERT INTO subscription_plans (name, target, services, price_per_unit, min_students, sort_order, is_active)
SELECT 'Pro 40', 'academy', ARRAY['naesin','voca'], 84000, 40, 2, true
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Pro 40' AND target = 'academy');

INSERT INTO subscription_plans (name, target, services, price_per_unit, min_students, sort_order, is_active)
SELECT 'Pro 80', 'academy', ARRAY['naesin','voca'], 140000, 80, 3, true
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Pro 80' AND target = 'academy');

INSERT INTO subscription_plans (name, target, services, price_per_unit, min_students, sort_order, is_active)
SELECT 'Pro 150', 'academy', ARRAY['naesin','voca'], 210000, 150, 4, true
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Pro 150' AND target = 'academy');
