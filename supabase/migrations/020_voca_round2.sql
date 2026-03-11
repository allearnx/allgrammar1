-- 올킬보카 2회독 지원

-- 1) 숙어 컬럼 추가
ALTER TABLE voca_vocabulary
ADD COLUMN IF NOT EXISTS idioms JSONB DEFAULT NULL;
-- 형식: [{"en":"be happy with","ko":"~에 만족하다","example_en":"I am happy with the result.","example_ko":"나는 그 결과에 만족한다."}]

-- 2) 2회독 진도 컬럼 추가
ALTER TABLE voca_student_progress
ADD COLUMN IF NOT EXISTS round2_flashcard_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS round2_quiz_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS round2_matching_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS round2_matching_attempt INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS round2_matching_completed BOOLEAN DEFAULT FALSE;
