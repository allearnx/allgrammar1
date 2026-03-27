-- 039: 독립 학생 자동 voca 배정 트리거 제거
-- 이제 독립 학생은 가입 후 직접 무료 서비스를 택1 합니다.
-- 기존 독립 학생(이미 voca 배정됨)은 영향 없음.

DROP TRIGGER IF EXISTS trg_auto_assign_voca ON users;
DROP FUNCTION IF EXISTS auto_assign_voca_for_independent_student();
