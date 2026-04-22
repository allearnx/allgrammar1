import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sid = '48341c30-3144-46c0-b540-6f5d70d2026e';

async function main() {
  // problem/mockExam 오답만 (sheet_id가 있는 것)
  const { data: wrongs } = await admin.from('naesin_wrong_answers')
    .select('id, sheet_id, stage, resolved, question_data')
    .eq('student_id', sid)
    .not('sheet_id', 'is', null)
    .in('stage', ['problem', 'mockExam']);

  console.log('problem/mockExam 오답 (sheet_id 있음):', wrongs?.length || 0, '개');

  const bySheet = {};
  for (const w of wrongs || []) {
    if (!bySheet[w.sheet_id]) bySheet[w.sheet_id] = [];
    bySheet[w.sheet_id].push(w);
  }

  for (const [sheetId, records] of Object.entries(bySheet)) {
    console.log(`\n  sheet=${sheetId.slice(0, 8)} (${records.length}개)`);
    for (const r of records) {
      const qd = r.question_data || {};
      console.log(`    stage=${r.stage} resolved=${r.resolved} Q${qd.number} user=${JSON.stringify(qd.userAnswer)} correct=${JSON.stringify(qd.correctAnswer)}`);
    }
  }

  // attempts JSONB
  const sheetIds = Object.keys(bySheet);
  if (sheetIds.length > 0) {
    const { data: attempts } = await admin.from('naesin_problem_attempts')
      .select('id, sheet_id, score, wrong_answers')
      .eq('student_id', sid)
      .in('sheet_id', sheetIds);

    console.log('\n\n=== 해당 시트의 attempts JSONB ===');
    for (const a of attempts || []) {
      const wa = a.wrong_answers || [];
      console.log(`  sheet=${a.sheet_id.slice(0, 8)} score=${a.score} jsonb_wrong_count=${wa.length}`);
      for (const w of wa) {
        console.log(`    Q${w.number} user=${JSON.stringify(w.userAnswer)} correct=${JSON.stringify(w.correctAnswer)}`);
      }
    }

    // 시트 정보
    const { data: sheets } = await admin.from('naesin_problem_sheets')
      .select('id, title, category, questions')
      .in('id', sheetIds);

    console.log('\n\n=== 시트 acceptedAnswers ===');
    for (const s of sheets || []) {
      const qs = s.questions || [];
      const accepted = qs.filter(q => q.acceptedAnswers?.length > 0);
      console.log(`  ${s.id.slice(0, 8)} [${s.category}] ${s.title || '(no title)'} — accepted: ${accepted.length}개`);
      for (const q of accepted) {
        console.log(`    Q${q.number} answer=${JSON.stringify(q.answer)} accepted=${JSON.stringify(q.acceptedAnswers)}`);
      }
    }
  }

  // sheet_id가 NULL인 오답도 확인 (passage/dialogue 등)
  const { count } = await admin.from('naesin_wrong_answers')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', sid)
    .is('sheet_id', null);
  console.log(`\n\nsheet_id=NULL인 오답: ${count}개 (passage/dialogue/vocab 등)`);
}

main().catch(console.error);
