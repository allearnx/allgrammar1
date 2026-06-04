import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit4 = 'ef3e4020-836b-4cc3-ae94-50e2ca327fea';

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions, answer_key')
  .eq('unit_id', unit4)
  .ilike('title', '%수동태 Step3%');

const sheet = sheets[0];
const qs = [...sheet.questions];
const ak = [...(sheet.answer_key || [])];

const fixes = [
  { num: 31, newAnswer: '1' },
  { num: 32, newAnswer: '2' },
  { num: 35, newAnswer: '3' },
  { num: 36, newAnswer: '1' },
  { num: 40, newAnswer: '2, 3' },
  { num: 41, newAnswer: '2' },
];

for (const { num, newAnswer } of fixes) {
  const idx = qs.findIndex(q => q.number === num);
  if (idx === -1) { console.log(`  ⚠️ Q${num} not found`); continue; }
  const old = qs[idx].answer;
  qs[idx] = { ...qs[idx], answer: newAnswer };
  ak[idx] = newAnswer;
  console.log(`Q${num}: "${old}" → "${newAnswer}"`);
}

const { error } = await sb
  .from('naesin_problem_sheets')
  .update({ questions: qs, answer_key: ak })
  .eq('id', sheet.id);

console.log(error ? `❌ ${error.message}` : '\n✅ 6문제 정답 수정 완료');
