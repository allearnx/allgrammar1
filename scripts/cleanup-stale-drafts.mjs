/**
 * 제출 완료 후 남아있는 잔여 draft 일괄 정리
 * 실행: node scripts/cleanup-stale-drafts.mjs
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 모든 draft 조회
  const { data: drafts } = await admin.from('naesin_problem_drafts')
    .select('id, student_id, sheet_id');

  if (!drafts || drafts.length === 0) {
    console.log('드래프트 없음');
    return;
  }
  console.log('전체 드래프트:', drafts.length, '개');

  // 제출 기록 확인
  const keys = drafts.map(d => ({ student_id: d.student_id, sheet_id: d.sheet_id }));
  const studentIds = [...new Set(drafts.map(d => d.student_id))];
  const sheetIds = [...new Set(drafts.map(d => d.sheet_id))];

  const { data: attempts } = await admin.from('naesin_problem_attempts')
    .select('student_id, sheet_id')
    .in('student_id', studentIds)
    .in('sheet_id', sheetIds);

  const submittedSet = new Set((attempts || []).map(a => `${a.student_id}:${a.sheet_id}`));

  const staleDraftIds = drafts
    .filter(d => submittedSet.has(`${d.student_id}:${d.sheet_id}`))
    .map(d => d.id);

  console.log('잔여(제출 완료 후 남은) 드래프트:', staleDraftIds.length, '개');

  if (staleDraftIds.length === 0) return;

  // 배치 삭제
  for (let i = 0; i < staleDraftIds.length; i += 100) {
    const batch = staleDraftIds.slice(i, i + 100);
    const { error } = await admin.from('naesin_problem_drafts').delete().in('id', batch);
    if (error) console.error('삭제 에러:', error.message);
    else console.log(`  ${i + batch.length}/${staleDraftIds.length} 삭제`);
  }

  console.log('완료!');
}

main().catch(console.error);
