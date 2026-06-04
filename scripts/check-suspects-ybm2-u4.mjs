import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const unit4 = '55f67584-aa9a-42d3-8b27-5a40e050a9ea';

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, unit_id, title, questions')
  .eq('unit_id', unit4)
  .ilike('title', '%Step2%')
  .order('title');

const suspects = [1, 13, 21, 22, 29, 33, 41, 51, 54];

for (const sheet of sheets) {
  if (!sheet.title.includes('비교급')) continue;
  console.log(`\n${'='.repeat(60)}\n${sheet.title}\n${'='.repeat(60)}`);

  for (const num of suspects) {
    const q = sheet.questions.find(x => x.number === num);
    if (!q) continue;
    console.log(`\nQ${num}: 정답="${q.answer}"`);
    console.log(`  ${(q.question || '').substring(0, 500)}`);
    if (q.options?.length) {
      q.options.forEach((c, i) => console.log(`  ${i+1}) ${(c||'').substring(0, 150)}`));
    }
    if (q.acceptedAnswers) console.log(`  허용: ${JSON.stringify(q.acceptedAnswers).substring(0, 300)}`);
  }
}
