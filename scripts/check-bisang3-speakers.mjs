import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const unitIds = [
  '61d8c49e-5888-4ca4-a21c-2091103b4159', // 3과
  'a0c4cc94-8791-4c63-884b-cec29fc04fbd', // 4과
];

const { data: dialogues } = await sb
  .from('naesin_dialogues')
  .select('id, unit_id, title, sentences')
  .in('unit_id', unitIds);

for (const d of dialogues) {
  const unit = d.unit_id === unitIds[0] ? '3과' : '4과';
  console.log(`\n=== ${unit} ${d.title} ===`);
  for (let i = 0; i < d.sentences.length; i++) {
    const s = d.sentences[i];
    const flag = (!s.speaker || !s.speaker.trim()) ? ' ⚠️ 빈 화자' : '';
    console.log(`  [${i+1}] [${s.speaker || '???'}] ${(s.original || '').substring(0, 80)}${flag}`);
    if (flag) console.log(`       → ${(s.korean || '').substring(0, 80)}`);
  }
}
