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

// Speaker assignments based on dialogue context analysis:
// 3과 대화문 1: Museum visit — G shares plan & asks directions, B offers to go together
// 4과 대화문 1: Musical & guitar — B/G intro dialogues

const speakerFixes = {
  // 3과 대화문 1
  [unitIds[0]]: {
    0: 'G',  // "I'm going to the National Museum this Sunday."
    1: 'G',  // "Is it okay if I ask you how to get there?" (same person continues)
    2: 'B',  // "Sure, or I can go with you, if it is okay with you?"
    3: 'G',  // "Oh! I'm totally okay with that!"
  },
  // 4과 대화문 1
  [unitIds[1]]: {
    0: 'B',   // "Let's watch this!"
    1: 'G',   // "Really? Do you find it fun to watch that kind of musical?"
    2: 'B',   // "Yes, I think it's exciting."
    21: 'G',  // "Hi! Are you planning to sign up for a guitar class?"
    22: 'B',  // "Yes, I'm thinking about it."
  },
};

for (const d of dialogues) {
  const fixes = speakerFixes[d.unit_id];
  if (!fixes) continue;

  const unit = d.unit_id === unitIds[0] ? '3과' : '4과';
  const sents = [...d.sentences];
  let fixed = 0;

  for (const [idx, speaker] of Object.entries(fixes)) {
    const i = Number(idx);
    if (i >= sents.length) continue;
    if (sents[i].speaker && sents[i].speaker.trim()) continue; // already has speaker
    sents[i] = { ...sents[i], speaker };
    console.log(`  ${unit} [${i}] → ${speaker}: "${(sents[i].original || '').substring(0, 60)}"`);
    fixed++;
  }

  if (fixed > 0) {
    const { error } = await sb
      .from('naesin_dialogues')
      .update({ sentences: sents })
      .eq('id', d.id);
    console.log(error ? `  ❌ ${unit}: ${error.message}` : `  ✅ ${unit}: ${fixed}건 화자 수정`);
  }
}

// Verify
console.log('\n=== 검증 ===');
const { data: check } = await sb
  .from('naesin_dialogues')
  .select('id, unit_id, title, sentences')
  .in('unit_id', unitIds);

let totalEmpty = 0;
for (const d of check) {
  const empty = (d.sentences || []).filter(s => !s.speaker || !s.speaker.trim());
  if (empty.length > 0) {
    totalEmpty += empty.length;
    const unit = d.unit_id === unitIds[0] ? '3과' : '4과';
    console.log(`  ⚠️ ${unit} ${d.title}: 빈 화자 ${empty.length}건 남음`);
  }
}
console.log(totalEmpty === 0 ? '  빈 화자 0건 ✅' : `  빈 화자 ${totalEmpty}건 ❌`);
