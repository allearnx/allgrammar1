import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = 'e39f437e-f4fa-4997-b9df-c56952cb6795';
const unit4 = 'fab05349-29a8-44cd-a147-82b3972b7059';

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, unit_id, title, questions')
  .in('unit_id', [unit3, unit4])
  .order('title');

// Focus on high-priority suspects (skip known false positives)
const suspects = {
  'to부정사의 형용사적 용법 Step1': [27, 49, 70, 74, 75, 78, 81],
  'to부정사의 형용사적 용법 Step2-2': [1, 3, 6, 15, 18, 19, 20],
  'want+목적어+to부정사 Step 1': [18, 79],
  'want+목적어+to부정사 Step 2': [62, 65, 66, 68, 69, 70, 71, 75, 86, 87, 88, 89, 90],
  '최상급 Step2': [1, 43, 52],
  '현재완료 Step 2': [59],
  '현재완료 Step 3': [10, 12, 19],
};

for (const sheet of sheets) {
  const key = Object.keys(suspects).find(k => {
    if (k === 'want+목적어+to부정사 Step 1') return sheet.title.includes('want') && sheet.title.includes('Step 1');
    if (k === 'want+목적어+to부정사 Step 2') return sheet.title.includes('want') && sheet.title.includes('Step 2');
    if (k === '현재완료 Step 2') return sheet.title.includes('현재완료') && sheet.title.includes('Step 2');
    if (k === '현재완료 Step 3') return sheet.title.includes('현재완료') && sheet.title.includes('Step 3');
    return sheet.title.includes(k);
  });
  if (!key) continue;

  const nums = suspects[key];
  console.log(`\n${'='.repeat(50)}\n${sheet.title}\n${'='.repeat(50)}`);

  for (const num of nums) {
    const q = sheet.questions.find(x => x.number === num);
    if (!q) continue;
    console.log(`\nQ${num}: 정답="${q.answer}"`);
    console.log(`  ${(q.question || '').substring(0, 350)}`);
    if (q.options?.length) {
      q.options.forEach((c, i) => console.log(`  ${i+1}) ${(c||'').substring(0, 100)}`));
    }
    if (q.acceptedAnswers) console.log(`  허용: ${JSON.stringify(q.acceptedAnswers).substring(0, 200)}`);
  }
}
