import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const unitId = '7bd48273-1c33-473d-82a8-4d4f8b1f9789';
const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions, answer_key')
  .eq('unit_id', unitId)
  .ilike('title', '%최상급 Step3%');

for (const s of sheets) {
  const q = s.questions[25]; // Q26 is index 25
  console.log('Sheet:', s.title, '(', s.id, ')');
  console.log('Q26 question:', (q?.question || '').substring(0, 300));
  console.log('Q26 answer (questions):', q?.answer);
  console.log('Q26 answer_key[25]:', s.answer_key[25]);
  if (q?.options) console.log('Options:', JSON.stringify(q.options));
}
