import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const unitId = '4b0b9e6d-533e-4251-827b-98304b68b3dc';

const suspects = {
  '과거형 Step1': [12],
  '과거형 Step2': [12, 15],
};

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions')
  .eq('unit_id', unitId)
  .order('title');

for (const sheet of sheets) {
  const nums = suspects[sheet.title];
  if (!nums) continue;

  console.log(`\n${'='.repeat(70)}\n${sheet.title}\n${'='.repeat(70)}`);

  for (const num of nums) {
    const q = sheet.questions.find(x => x.number === num);
    if (!q) continue;
    console.log(`\n───── Q${num} ─────`);
    console.log(`정답: "${q.answer}"`);
    console.log(`문제:\n${(q.question || '').substring(0, 800)}`);
    if (q.options?.length) {
      console.log('선택지:');
      q.options.forEach((c, i) => console.log(`  ${i+1}) ${(c||'').substring(0, 200)}`));
    }
    if (q.acceptedAnswers) console.log(`허용 답: ${JSON.stringify(q.acceptedAnswers)}`);
    if (q.explanation) console.log(`해설: ${(q.explanation || '').substring(0, 300)}`);
  }
}
