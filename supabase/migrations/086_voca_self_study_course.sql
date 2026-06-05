-- 올킬보카 셀프학습 개인 코스 추가 (29,000원)
INSERT INTO courses (title, category, description, price, is_active, sort_order)
VALUES (
  '올킬보카 셀프학습',
  'voca',
  '최근 5개년 고1·고2·고3 기출 단어를 셀프로 완벽 암기! 1회독 + 2회독 전체 해금',
  29000,
  true,
  0
)
ON CONFLICT DO NOTHING;
