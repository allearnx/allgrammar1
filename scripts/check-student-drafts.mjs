import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const sid = 'a425d630-6726-48fe-beba-0f50acef32df';

async function main() {
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const student = users.find(u => u.id === sid);
  console.log('학생:', student?.user_metadata?.name, student?.email);

  const { data: drafts } = await admin.from('naesin_problem_drafts')
    .select('sheet_id, answered_count, updated_at, draft_data')
    .eq('student_id', sid);
  console.log('\n드래프트:', drafts?.length, '개');
  for (const d of drafts || []) {
    const dd = d.draft_data || {};
    const wrongCount = dd.wrongList?.length || 0;
    console.log('  sheet:', d.sheet_id, 'answered:', d.answered_count, 'wrongs:', wrongCount, 'mode:', dd.mode, 'updated:', d.updated_at?.slice(0,16));
  }

  const { data: attempts } = await admin.from('naesin_problem_attempts')
    .select('sheet_id, score, total_questions, created_at')
    .eq('student_id', sid)
    .order('created_at', { ascending: false });
  console.log('\n제출(attempt):', attempts?.length, '개');
  for (const a of attempts || []) {
    console.log('  sheet:', a.sheet_id, 'score:', a.score + '/' + a.total_questions, 'date:', a.created_at?.slice(0,16));
  }

  const attemptSheetIds = new Set((attempts || []).map(a => a.sheet_id));
  const overlap = (drafts || []).filter(d => attemptSheetIds.has(d.sheet_id));
  const draftOnly = (drafts || []).filter(d => !attemptSheetIds.has(d.sheet_id));
  console.log('\n드래프트+제출 중복(잔여):', overlap.length, '개');
  for (const d of overlap) console.log('  ', d.sheet_id);
  console.log('드래프트만(미제출):', draftOnly.length, '개');
  for (const d of draftOnly) console.log('  ', d.sheet_id, 'answered:', d.answered_count);
}
main().catch(console.error);
