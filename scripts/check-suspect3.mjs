import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = '292901be-3bc8-4d27-9456-35ab96718d33';
const unit4 = 'ef3e4020-836b-4cc3-ae94-50e2ca327fea';

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, unit_id, title, questions')
  .in('unit_id', [unit3, unit4])
  .order('title');

const suspects = {
  'so that Step 1': [8, 12, 22, 48],
  'so that Step 2': [24, 28, 32, 39],
  'to부정사의 형용사적 용법 Step2-1': [10],
  'to부정사의 형용사적 용법 Step2-2': [1, 3, 6],
  '수동태 Step1': [11, 12, 25],
  '수동태 step2': [33, 39],
  '수동태 Step3': [31, 32, 33, 35, 36, 40, 41],
};

for (const sheet of sheets) {
  // Match sheet title to suspects
  const key = Object.keys(suspects).find(k => sheet.title.includes(k));
  if (!key) continue;

  const nums = suspects[key];
  console.log(`\n=== ${sheet.title} ===`);

  for (const num of nums) {
    const q = sheet.questions.find(x => x.number === num);
    if (!q) continue;
    console.log(`\n  Q${q.number}:`);
    console.log(`  문제: ${(q.question || '').replace(/\n/g, ' ').substring(0, 150)}`);
    if (q.choices && q.choices.length) {
      q.choices.forEach((c, i) => console.log(`    ${i + 1}) ${(c || '').substring(0, 80)}`));
    }
    if (q.options && q.options.length) {
      q.options.forEach((c, i) => console.log(`    ${i + 1}) ${(c || '').substring(0, 80)}`));
    }
    console.log(`  정답: ${q.answer}`);
  }
}

// Also check Q63 in 능률김 to부정사 Step1 (same template issue)
console.log('\n=== to부정사 Step1 Q63 (쉼표 확인) ===');
const toSheet = sheets.find(s => s.title.includes('to부정사') && s.title.includes('Step1'));
if (toSheet) {
  const q63 = toSheet.questions.find(x => x.number === 63);
  console.log(`  정답: "${q63.answer}"`);
}
