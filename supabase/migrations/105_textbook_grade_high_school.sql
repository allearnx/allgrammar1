-- 교과서 학년 범위 확장: 중1~중3(1~3)만 허용하던 CHECK을 고1~고3(4~6)까지 허용
-- UI 표기: 1~3 = 중1~중3, 4~6 = 고1~고3 (src/lib/naesin/grade-label.ts)

ALTER TABLE naesin_textbooks DROP CONSTRAINT IF EXISTS naesin_textbooks_grade_check;
ALTER TABLE naesin_textbooks ADD CONSTRAINT naesin_textbooks_grade_check CHECK (grade BETWEEN 1 AND 6);
