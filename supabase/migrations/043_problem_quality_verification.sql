-- 043: AI 문제 품질 검증 컬럼 추가
-- quality_score: Layer 3 품질 점수 (0-100)
-- rejection_reason: 선생님 거절 사유
-- validation_result: 전체 검증 결과 JSON

ALTER TABLE naesin_similar_problems
  ADD COLUMN IF NOT EXISTS quality_score INTEGER,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT CHECK (
    rejection_reason IS NULL OR rejection_reason IN (
      'wrong_answer', 'grammar_error', 'too_easy', 'too_hard', 'ambiguous', 'duplicate', 'other'
    )
  ),
  ADD COLUMN IF NOT EXISTS validation_result JSONB;

-- 품질 점수 인덱스 (낮은 점수 우선 리뷰용)
CREATE INDEX IF NOT EXISTS idx_similar_problems_quality
  ON naesin_similar_problems(quality_score)
  WHERE quality_score IS NOT NULL;

-- 거절 사유 인덱스 (통계/분석용)
CREATE INDEX IF NOT EXISTS idx_similar_problems_rejection
  ON naesin_similar_problems(rejection_reason)
  WHERE rejection_reason IS NOT NULL;
