import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const unit1 = '7bd48273-1c33-473d-82a8-4d4f8b1f9789';
const unit2 = '53685a6c-37ef-4ce9-b4d0-17d7b698cfb4';

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, unit_id, title, questions')
  .in('unit_id', [unit1, unit2])
  .order('title');

// Suspects from AI verification
const suspects = {
  '1과 to 부정사의 형용사적 용법 Step 1': [27, 70, 74, 75, 78, 81, 84, 89, 90],
  'the+비교급,the+비교급 Step2': [1, 13, 21, 22, 29, 33, 41, 51, 54],
  'to부정사의 형용사적 용법 Step2': [3],
  '사역동사 Step 1': [18, 23],
  '사역동사 Step 2': [28, 34, 45, 57],
};

for (const sheet of sheets) {
  const key = Object.keys(suspects).find(k => sheet.title.includes(k) || sheet.title === k);
  if (!key) continue;

  const nums = suspects[key];
  console.log(`\n${'='.repeat(60)}\n${sheet.title}\n${'='.repeat(60)}`);

  for (const num of nums) {
    const q = sheet.questions.find(x => x.number === num);
    if (!q) continue;
    console.log(`\nQ${num}: 정답="${q.answer}"`);
    console.log(`  ${(q.question || '').substring(0, 400)}`);
    if (q.options?.length) {
      q.options.forEach((c, i) => console.log(`  ${i+1}) ${(c||'').substring(0, 120)}`));
    }
    if (q.acceptedAnswers) console.log(`  허용: ${JSON.stringify(q.acceptedAnswers).substring(0, 200)}`);
  }
}
