-- 어휘 레벨 진단 익명 완주 기록 + 전화번호 리드 (value-first 퍼널 보강, 2026-07-21)
--
-- /level-test 완주 시점에 가입 여부와 무관하게 결과를 저장한다 (이탈자 레벨 분포 파악).
-- 게이트에서 "이름·전번 남기고 결과 보기"를 고르면 name/phone이 채워져 전화 리드가 된다.
-- 이후 가입해 정식 제출하면 linked_student_id로 연결.
--
-- 접근: 공개 API(service role)와 boss 페이지(admin client)만 사용 →
-- RLS 활성 + 정책 없음 = anon/authenticated 직접 접근 차단.

CREATE TABLE IF NOT EXISTS voca_diagnostic_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  grade TEXT NOT NULL,
  start_band TEXT NOT NULL,
  final_band TEXT NOT NULL,
  final_qualifier TEXT NOT NULL DEFAULT 'exact' CHECK (final_qualifier IN ('exact', 'above', 'below')),
  coverage_score INTEGER NOT NULL CHECK (coverage_score >= 0 AND coverage_score <= 100),
  rounds JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voca_diagnostic_leads_created ON voca_diagnostic_leads (created_at DESC);

ALTER TABLE voca_diagnostic_leads ENABLE ROW LEVEL SECURITY;

GRANT ALL ON voca_diagnostic_leads TO service_role;
