-- 올킬보카 셀프학습 가격 29,000 → 24,000원 변경
UPDATE courses
SET price = 24000,
    updated_at = now()
WHERE title = '올킬보카 셀프학습'
  AND category = 'voca';
