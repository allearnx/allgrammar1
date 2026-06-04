import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = 'dc3155de-270a-48eb-b667-1fe4186d0f15';

const { data: dialogues } = await sb
  .from('naesin_dialogues')
  .select('id, sentences')
  .eq('unit_id', unit3);

for (const d of dialogues) {
  const sents = [...d.sentences];
  let fixed = 0;

  for (let i = 0; i < sents.length; i++) {
    if (sents[i].korean && sents[i].korean.includes('잘했어요! (잘했어요!)')) {
      const oldKr = sents[i].korean;
      sents[i] = { ...sents[i], korean: oldKr.replace('잘했어요! (잘했어요!)', '잘했어요!') };
      console.log(`  [${i+1}] "${oldKr}" → "${sents[i].korean}"`);
      fixed++;
    }
  }

  if (fixed > 0) {
    const { error } = await sb.from('naesin_dialogues').update({ sentences: sents }).eq('id', d.id);
    console.log(error ? `  ❌ ${error.message}` : `  ✅ 저장 완료`);
  }
}
