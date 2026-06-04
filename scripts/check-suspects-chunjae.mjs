import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = 'dc3155de-270a-48eb-b667-1fe4186d0f15';
const unit4 = 'a3d94bca-25a5-4f95-a91c-496f463cdc89';

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, unit_id, title, questions')
  .in('unit_id', [unit3, unit4])
  .order('title');

const suspects = {
  'so that Step 1': [8, 12, 22],
  'so that Step 2': [24, 28, 32, 39],
  '수동태 Step1': [11, 12, 25],
  '수동태 step2': [4, 33, 39, 55],
  '수동태 Step3': [30, 33, 48],
  '접속사 although Step2': [1, 2, 3, 6, 12, 26, 27, 28, 38, 40, 41, 42, 43, 44, 46],
  '현재완료 Step 1': [93],
  '현재완료 Step 2': [3, 10, 38, 39, 40, 41, 42, 43, 44, 45],
};

for (const sheet of sheets) {
  const key = Object.keys(suspects).find(k => sheet.title.includes(k));
  if (!key) continue;

  const nums = suspects[key];
  console.log(`\n${'='.repeat(60)}\n=== ${sheet.title} ===\n${'='.repeat(60)}`);

  for (const num of nums) {
    const q = sheet.questions.find(x => x.number === num);
    if (!q) continue;
    console.log(`\n  Q${q.number}:`);
    console.log(`  문제: ${(q.question || '').substring(0, 300)}`);
    if (q.options && q.options.length) {
      q.options.forEach((c, i) => console.log(`    ${i + 1}) ${(c || '').substring(0, 120)}`));
    }
    console.log(`  정답: ${q.answer}`);
    if (q.acceptedAnswers && q.acceptedAnswers.length) {
      console.log(`  허용답: ${JSON.stringify(q.acceptedAnswers)}`);
    }
  }
}
