import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = 'dc3155de-270a-48eb-b667-1fe4186d0f15';

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions, answer_key')
  .eq('unit_id', unit3)
  .ilike('title', '%although Step1%');

const sheet = sheets[0];
const suspectNums = [8, 17, 18, 32, 38, 39, 43];

console.log(`=== ${sheet.title} — 의심 문제 확인 ===\n`);

for (const num of suspectNums) {
  const q = sheet.questions.find(q => q.number === num);
  const akIdx = sheet.questions.findIndex(q2 => q2.number === num);
  const akAnswer = sheet.answer_key?.[akIdx];

  console.log(`Q${num}:`);
  console.log(`  문제: ${(q.question || '').substring(0, 120)}`);
  if (q.options && q.options.length) {
    q.options.forEach((c, i) => console.log(`    ${i + 1}) ${(c || '').substring(0, 80)}`));
  }
  console.log(`  q.answer: "${q.answer}" (type: ${typeof q.answer}, isArray: ${Array.isArray(q.answer)})`);
  console.log(`  answer_key[${akIdx}]: "${akAnswer}" (type: ${typeof akAnswer}, isArray: ${Array.isArray(akAnswer)})`);
  if (q.acceptedAnswers) console.log(`  acceptedAnswers: ${JSON.stringify(q.acceptedAnswers)}`);
  console.log('');
}

// Check the attempt's raw answers for these questions
const { data: attempts } = await sb
  .from('naesin_problem_attempts')
  .select('*')
  .eq('sheet_id', sheet.id);

if (attempts.length > 0) {
  const a = attempts[0];
  console.log('=== 학생 답안 raw 데이터 ===');
  for (const num of suspectNums) {
    const idx = num - 1; // 0-indexed
    const rawAnswer = a.answers[idx];
    console.log(`  Q${num}: raw="${rawAnswer}" (type: ${typeof rawAnswer})`);
  }

  console.log('\n=== wrong_answers raw 데이터 ===');
  for (const w of a.wrong_answers) {
    if (suspectNums.includes(w.number)) {
      console.log(`  Q${w.number}:`, JSON.stringify(w));
    }
  }
}
