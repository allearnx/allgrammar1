-- 046_auto_generated_chat_questions.sql
-- AI 자동 질문 생성 여부 컬럼 추가

ALTER TABLE naesin_grammar_chat_questions
  ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false;
