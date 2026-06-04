import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const unitIds = [
  '61d8c49e-5888-4ca4-a21c-2091103b4159', // 3과
  'a0c4cc94-8791-4c63-884b-cec29fc04fbd', // 4과
];

// Suspects from AI verify
const suspects = {
  'whether/if Step1': [13],
  '과거완료 step 1': [7],
  '과거완료 step 2': [1,2,5,6,7,8,15,16,21,24,25,31,46,50,58,62,71,74,76,77,83],
};

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, unit_id, title, questions')
  .in('unit_id', unitIds)
  .order('title');

for (const sheet of sheets) {
  const nums = suspects[sheet.title];
  if (!nums) continue;

  console.log(`\n${'='.repeat(70)}\n${sheet.title} (${nums.length}건 의심)\n${'='.repeat(70)}`);

  for (const num of nums) {
    const q = sheet.questions.find(x => x.number === num);
    if (!q) { console.log(`\nQ${num}: 없음`); continue; }
    console.log(`\n───── Q${num} ─────`);
    console.log(`정답: "${q.answer}"`);
    console.log(`유형: ${q.type || 'unknown'}`);
    console.log(`문제:\n${(q.question || '').substring(0, 800)}`);
    if (q.options?.length) {
      console.log('선택지:');
      q.options.forEach((c, i) => console.log(`  ${i+1}) ${(c||'').substring(0, 200)}`));
    }
    if (q.subParts?.length) {
      console.log('하위 문제:');
      for (const sp of q.subParts) {
        console.log(`  (${sp.number || sp.label}) ${(sp.question || '').substring(0, 200)} → 정답: "${sp.answer}"`);
      }
    }
    if (q.acceptedAnswers) console.log(`허용 답: ${JSON.stringify(q.acceptedAnswers)}`);
    if (q.explanation) console.log(`해설: ${(q.explanation || '').substring(0, 300)}`);
  }
}
