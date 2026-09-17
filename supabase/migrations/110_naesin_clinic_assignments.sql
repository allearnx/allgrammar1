-- 학생별 "클리닉(집중훈련)" 시트 배정 (2026-09-17, 사장님 지시).
-- 배경: 관계부사=전치사+관계대명사 등 특정 하위 개념에서 반복 오답을 보이는 학생에게
-- 단원 전체가 아니라 "그 학생에게만" 보충 문제를 배정하고 싶다는 요청.
--
-- 접근: naesin_templates(독립 템플릿 라이브러리)에서 학생별로 사본을 만들되, 그 사본을
-- unit_id 대신 assigned_student_id로 연결한다. 기존 /student/naesin/exam/[sheetId] 라우트가
-- 이미 unit_id 없이도(unit_id=null 허용) 시트를 그대로 풀 수 있어(ProblemTab이 unitId=null을
-- 받아도 정상 동작) 학생 풀이 화면은 새로 만들 필요가 없다. 모든 문항은 idempotent 가드
-- (IF NOT EXISTS 등)로 작성 — 이 세션에서 Management API로 직접 적용 + 추후 Vercel db push
-- 재적용 시에도 에러 없이 통과해야 하기 때문.

ALTER TABLE naesin_problem_sheets ALTER COLUMN unit_id DROP NOT NULL;

ALTER TABLE naesin_problem_sheets ADD COLUMN IF NOT EXISTS assigned_student_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE naesin_problem_sheets ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id);
ALTER TABLE naesin_problem_sheets ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE naesin_problem_sheets ADD COLUMN IF NOT EXISTS assigned_note TEXT;

-- 단원 소속 시트(unit_id 필수)이거나 학생 개별 배정 시트(assigned_student_id 필수) 중 하나여야 함.
ALTER TABLE naesin_problem_sheets DROP CONSTRAINT IF EXISTS naesin_problem_sheets_unit_or_assignee;
ALTER TABLE naesin_problem_sheets ADD CONSTRAINT naesin_problem_sheets_unit_or_assignee
  CHECK (unit_id IS NOT NULL OR assigned_student_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_naesin_problem_sheets_assigned_student
  ON naesin_problem_sheets(assigned_student_id)
  WHERE assigned_student_id IS NOT NULL;
