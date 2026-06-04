import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = '292901be-3bc8-4d27-9456-35ab96718d33';

// Fix empty speakers
const { data: dialogues } = await sb
  .from('naesin_dialogues')
  .select('id, sentences')
  .eq('unit_id', unit3);

for (const d of dialogues) {
  const sents = [...d.sentences];
  let fixed = 0, lastSpeaker = '';

  for (let i = 0; i < sents.length; i++) {
    if (sents[i].speaker && sents[i].speaker.trim()) {
      lastSpeaker = sents[i].speaker.trim();
    } else if (lastSpeaker) {
      console.log(`  [${i + 1}] "${lastSpeaker}" 적용: ${sents[i].original.substring(0, 60)}`);
      sents[i] = { ...sents[i], speaker: lastSpeaker };
      fixed++;
    }
  }

  if (fixed > 0) {
    const { error } = await sb.from('naesin_dialogues').update({ sentences: sents }).eq('id', d.id);
    console.log(error ? `❌ ${error.message}` : `✅ ${fixed}건 빈 화자 수정`);
  }
}
