-- ============================================
-- 052: 기존 학생 enabled_stages에 textbookVideo, mockExam 추가
-- migration 050은 DEFAULT만 변경, 기존 행은 미적용
-- ============================================

UPDATE naesin_student_settings
SET enabled_stages = enabled_stages || '["textbookVideo"]'::jsonb
WHERE NOT (enabled_stages @> '"textbookVideo"'::jsonb);

UPDATE naesin_student_settings
SET enabled_stages = enabled_stages || '["mockExam"]'::jsonb
WHERE NOT (enabled_stages @> '"mockExam"'::jsonb);
