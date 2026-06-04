import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = '43dcebb7-02bd-4b40-b611-8cd61de3705a';
const unit4 = '95de2f74-4e7a-428c-9b64-7191304b8112';

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, unit_id, title, questions')
  .in('unit_id', [unit3, unit4])
  .order('title');

const suspects = {
  'keep/make/find+목적어+목적격보어 Step1': [25, 29, 32],
  'keep/make/find+목적어+목적격보어 Step2': [11, 13, 16, 23, 29, 38],
  'tell+목적어+to부정사 Step1': [30, 51, 52, 53],
  'tell+목적어+to부정사 Step2': [2, 17, 19, 26, 52, 60, 68],
  '주격관계대명사 Step1': [44, 67],
};

for (const sheet of sheets) {
  const key = Object.keys(suspects).find(k => sheet.title.includes(k));
  if (!key) continue;

  const nums = suspects[key];
  console.log(`\n${'='.repeat(60)}\n=== ${sheet.title} ===\n${'='.repeat(60)}`);

  for (const num of nums) {
    const q = sheet.questions.find(x => x.number === num);
    if (!q) continue;
    console.log(`\n  Q${num}:`);
    console.log(`  문제: ${(q.question || '').substring(0, 300)}`);
    if (q.options && q.options.length) {
      q.options.forEach((c, i) => console.log(`    ${i + 1}) ${(c || '').substring(0, 120)}`));
    }
    console.log(`  정답: ${q.answer}`);
    if (q.acceptedAnswers) console.log(`  허용답: ${JSON.stringify(q.acceptedAnswers)}`);
  }
}
