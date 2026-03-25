-- 038: courses.teacher_id FK change: users(id) -> teacher_profiles(id)

-- 1. Drop old FK
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_teacher_id_fkey;

-- 2. Convert existing teacher_id values (users.id -> teacher_profiles.id)
UPDATE courses
SET teacher_id = tp.id
FROM teacher_profiles tp
WHERE courses.teacher_id = tp.user_id
  AND courses.teacher_id IS NOT NULL;

-- Clear orphan teacher_id values
UPDATE courses
SET teacher_id = NULL
WHERE teacher_id IS NOT NULL
  AND teacher_id NOT IN (SELECT id FROM teacher_profiles);

-- 3. Add new FK
ALTER TABLE courses
  ADD CONSTRAINT courses_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE SET NULL;
