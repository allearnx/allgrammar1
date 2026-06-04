import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const unitIds = ['4b0b9e6d-533e-4251-827b-98304b68b3dc']; // 3과
const unitNames = ['3과'];

// 1. Vocabulary
console.log('========== 단어 ==========');
const { data: vocab } = await sb
  .from('naesin_vocabulary')
  .select('unit_id, front_text, back_text, sort_order')
  .in('unit_id', unitIds)
  .order('sort_order');

for (let ui = 0; ui < unitIds.length; ui++) {
  const uv = (vocab || []).filter(v => v.unit_id === unitIds[ui]);
  console.log(`\n--- ${unitNames[ui]} (${uv.length}개) ---`);
  for (const v of uv) {
    console.log(`  ${v.front_text} → ${v.back_text}`);
  }
}

// 2. Dialogues
console.log('\n\n========== 대화문 ==========');
const { data: dialogues } = await sb
  .from('naesin_dialogues')
  .select('unit_id, title, sentences')
  .in('unit_id', unitIds);

for (let ui = 0; ui < unitIds.length; ui++) {
  const ud = (dialogues || []).filter(d => d.unit_id === unitIds[ui]);
  if (!ud.length) { console.log(`\n--- ${unitNames[ui]}: 없음 ---`); continue; }
  for (const d of ud) {
    console.log(`\n--- ${unitNames[ui]} ${d.title} ---`);
    for (const s of (d.sentences || [])) {
      console.log(`  [${s.speaker || '?'}] ${s.original}`);
      console.log(`        → ${s.korean}`);
    }
  }
}

// 3. Passages
console.log('\n\n========== 본문 ==========');
const { data: passages } = await sb
  .from('naesin_passages')
  .select('unit_id, title, sentences')
  .in('unit_id', unitIds);

for (let ui = 0; ui < unitIds.length; ui++) {
  const up = (passages || []).filter(p => p.unit_id === unitIds[ui]);
  if (!up.length) { console.log(`\n--- ${unitNames[ui]}: 없음 ---`); continue; }
  for (const p of up) {
    console.log(`\n--- ${unitNames[ui]} ${p.title} ---`);
    for (const s of (p.sentences || [])) {
      console.log(`  ${s.original}`);
      console.log(`    → ${s.korean}`);
    }
  }
}
