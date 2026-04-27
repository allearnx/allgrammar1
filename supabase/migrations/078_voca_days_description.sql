-- voca_days에 description 컬럼 추가 (Day 카드에 연한 라벨 표시용)
ALTER TABLE voca_days ADD COLUMN IF NOT EXISTS description TEXT;
