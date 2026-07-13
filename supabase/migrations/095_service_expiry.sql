-- 개인 결제 서비스 만료 자동 처리
-- - service_assignments.expires_at: null = 무기한 (학원/수동 배정, 기간 없는 코스)
-- - courses.duration_days: 결제 시 부여 기간 (null = 무기한, 기존 동작 유지)
-- 만료 처리는 크론 없이 lazy — plan-context/서비스 조회(5분 캐시) 시점에 만료 행 삭제

ALTER TABLE service_assignments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
COMMENT ON COLUMN service_assignments.expires_at IS '만료 시각 (null=무기한). 만료된 payment 행은 조회 시점에 lazy 삭제';

ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_days INTEGER;
COMMENT ON COLUMN courses.duration_days IS '결제 시 부여되는 이용 기간(일). null=무기한(기존 동작)';

-- 보카 개인 판매 코스 기간 백필: 월 상품 30일, 6개월 패스 180일
UPDATE courses SET duration_days = 180 WHERE category = 'voca' AND title LIKE '%6개월%' AND duration_days IS NULL;
UPDATE courses SET duration_days = 30 WHERE category = 'voca' AND duration_days IS NULL;
