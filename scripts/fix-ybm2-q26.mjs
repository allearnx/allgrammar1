import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sheetId = 'cd9ddded-05af-4694-a121-77c8430694e4';

const { data: sheet } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions, answer_key, source_template_id')
  .eq('id', sheetId)
  .single();

// Fix answer_key[25] to match questions[25].answer
const ak = [...sheet.answer_key];
ak[25] = sheet.questions[25].answer; // "is the most difficult"

const { error } = await sb
  .from('naesin_problem_sheets')
  .update({ answer_key: ak })
  .eq('id', sheetId);

console.log(error
  ? `❌ ${error.message}`
  : `✅ 최상급 Step3 Q26 answer_key 수정: "${sheet.answer_key[25]}" → "${ak[25]}"`);

// Template sync
if (sheet.source_template_id) {
  const { data: tmpl } = await sb
    .from('naesin_templates')
    .select('id, title, answer_key')
    .eq('id', sheet.source_template_id)
    .single();
  if (tmpl) {
    const tak = [...tmpl.answer_key];
    tak[25] = ak[25];
    await sb.from('naesin_templates').update({ answer_key: tak }).eq('id', tmpl.id);
    console.log(`  ✅ 템플릿 "${tmpl.title}" 동기화`);
  }
} else {
  console.log('  (source_template_id 없음)');
}
