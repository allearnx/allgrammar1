-- 예문 한글 해석 컬럼 추가
ALTER TABLE voca_vocabulary ADD COLUMN IF NOT EXISTS example_sentence_ko text;
