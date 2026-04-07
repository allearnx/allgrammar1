-- 064: naesin_wrong_answers에 sheet_id 컬럼 추가 (문제 시트 추적용)
ALTER TABLE naesin_wrong_answers
ADD COLUMN IF NOT EXISTS sheet_id UUID REFERENCES naesin_problem_sheets(id) ON DELETE CASCADE;

-- 인덱스: sheet_id로 조회 시 성능 향상
CREATE INDEX IF NOT EXISTS idx_naesin_wrong_answers_sheet_id
ON naesin_wrong_answers(sheet_id) WHERE sheet_id IS NOT NULL;
