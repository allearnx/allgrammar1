/**
 * 결제 플로우가 잘못 심은 round2_unlocked=true 해제 (2026-08-06, 김민유 신고).
 *
 * 배경: 결제 시 R2 해금용으로 심던 플래그(d872efe)가 7/20(1610946)부터 "1회독 면제"
 * 의미로 바뀌어, 결제 학생 홈의 완료 표시가 2회독 기준이 됨 → R1 완료가 안 보임.
 * 결제 학생은 플랜 게이트(tier=paid → voca:round2)로 이미 2회독이 열려 있어 플래그 불필요.
 *
 * 대상: source='payment'인 voca 배정만 (subscription의 true는 관리자 면제 토글일 수 있어 제외).
 *
 *   node scripts/fix-payment-round2-flag.mjs          # dry-run (조회만)
 *   node scripts/fix-payment-round2-flag.mjs --apply  # 실제 수정
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}

const APPLY = process.argv.includes('--apply');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: targets, error } = await supabase
  .from('service_assignments')
  .select('id, student_id, source, round2_unlocked, created_at')
  .eq('service', 'voca')
  .eq('source', 'payment')
  .eq('round2_unlocked', true);
if (error) throw error;

const { data: users } = await supabase
  .from('users')
  .select('id, full_name')
  .in('id', (targets ?? []).map((t) => t.student_id));

console.log(`대상 ${targets?.length ?? 0}건 (원본 백업):`);
for (const t of targets ?? []) {
  const name = (users ?? []).find((u) => u.id === t.student_id)?.full_name ?? '?';
  console.log(`  ${name} assignment_id=${t.id} student_id=${t.student_id} created=${t.created_at}`);
}

if (!APPLY) {
  console.log('\ndry-run — 적용하려면 --apply');
  process.exit(0);
}

const { error: upErr } = await supabase
  .from('service_assignments')
  .update({ round2_unlocked: false })
  .eq('service', 'voca')
  .eq('source', 'payment')
  .eq('round2_unlocked', true);
if (upErr) throw upErr;
console.log('\n적용 완료 — round2_unlocked=false');
