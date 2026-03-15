-- 031: Add services column to academies for service assignment (naesin / voca)
ALTER TABLE academies ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}'::TEXT[];
