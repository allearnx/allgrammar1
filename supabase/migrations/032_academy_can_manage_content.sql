-- 학원별 콘텐츠 관리 권한 플래그
-- 기본 false → 새 학원은 콘텐츠 수정 불가
ALTER TABLE academies ADD COLUMN IF NOT EXISTS can_manage_content BOOLEAN NOT NULL DEFAULT false;
