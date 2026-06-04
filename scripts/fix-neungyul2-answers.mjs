import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = '292901be-3bc8-4d27-9456-35ab96718d33';
const unit4 = 'ef3e4020-836b-4cc3-ae94-50e2ca327fea';

// 1. Fix Q63 comma → period (to부정사 Step1)
console.log('=== 1. to부정사 Step1 Q63 쉼표→마침표 ===');
const { data: toSheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions, answer_key')
  .eq('unit_id', unit3)
  .ilike('title', '%to부정사%Step1%');

const toSheet = toSheets[0];
const toQs = [...toSheet.questions];
const toAk = [...(toSheet.answer_key || [])];
const idx63 = toQs.findIndex(q => q.number === 63);
const old63 = toQs[idx63].answer;
const new63 = old63.replace(/,\s*$/, '.');
toQs[idx63] = { ...toQs[idx63], answer: new63 };
toAk[idx63] = new63;
console.log(`  "${old63}" → "${new63}"`);

const { error: e1 } = await sb.from('naesin_problem_sheets').update({ questions: toQs, answer_key: toAk }).eq('id', toSheet.id);
console.log(e1 ? `  ❌ ${e1.message}` : '  ✅ 저장 완료');

// 2. Fix Q48 tense (so that Step1)
console.log('\n=== 2. so that Step1 Q48 시제 수정 ===');
const { data: soSheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions, answer_key')
  .eq('unit_id', unit4)
  .ilike('title', '%so that Step 1%');

const soSheet = soSheets[0];
const soQs = [...soSheet.questions];
const soAk = [...(soSheet.answer_key || [])];
const idx48 = soQs.findIndex(q => q.number === 48);
const old48 = soQs[idx48].answer;
const new48 = 'I made vocabulary cards so that I could remember them.';
soQs[idx48] = { ...soQs[idx48], answer: new48 };
soAk[idx48] = new48;
console.log(`  "${old48}" → "${new48}"`);

const { error: e2 } = await sb.from('naesin_problem_sheets').update({ questions: soQs, answer_key: soAk }).eq('id', soSheet.id);
console.log(e2 ? `  ❌ ${e2.message}` : '  ✅ 저장 완료');

// 3. Show 수동태 Step3 full questions
console.log('\n=== 3. 수동태 Step3 전체 의심 문제 ===');
const { data: passSheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions')
  .eq('unit_id', unit4)
  .ilike('title', '%수동태 Step3%');

const passSheet = passSheets[0];
const suspects = [31, 32, 33, 35, 36, 40, 41];

for (const num of suspects) {
  const q = passSheet.questions.find(x => x.number === num);
  if (!q) continue;
  console.log(`\n--- Q${q.number} ---`);
  console.log(`문제: ${q.question}`);
  if (q.choices && q.choices.length) {
    q.choices.forEach((c, i) => console.log(`  ${i + 1}) ${c}`));
  }
  if (q.options && q.options.length) {
    q.options.forEach((c, i) => console.log(`  ${i + 1}) ${c}`));
  }
  console.log(`정답: ${q.answer}`);
}
