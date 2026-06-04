import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = 'dc3155de-270a-48eb-b667-1fe4186d0f15';
const unit4 = 'a3d94bca-25a5-4f95-a91c-496f463cdc89';

// 1. 대화문: "Great job!" 번역 수정
console.log('=== 1. 대화문 수정 ===');
const { data: dialogues } = await sb
  .from('naesin_dialogues')
  .select('id, title, sentences')
  .eq('unit_id', unit3);

for (const d of dialogues) {
  const sents = [...d.sentences];
  let fixed = 0;

  for (let i = 0; i < sents.length; i++) {
    if (sents[i].original && sents[i].original.includes('Great job')) {
      const oldKr = sents[i].korean;
      sents[i] = { ...sents[i], korean: sents[i].korean.replace('축하해요!', '잘했어요!') };
      if (oldKr !== sents[i].korean) {
        console.log(`  [${i+1}] "${sents[i].original}"`);
        console.log(`       "${oldKr}" → "${sents[i].korean}"`);
        fixed++;
      }
    }
  }

  if (fixed > 0) {
    const { error } = await sb.from('naesin_dialogues').update({ sentences: sents }).eq('id', d.id);
    console.log(error ? `  ❌ ${error.message}` : `  ✅ ${fixed}건 저장 완료`);
  }
}

// 2. 본문: "writing system" / "oil" 번역 수정
console.log('\n=== 2. 본문 수정 ===');

// 4과 본문 - "문자가 없어서" → "문자 체계가 없어서"
const { data: passages4 } = await sb
  .from('naesin_passages')
  .select('id, title, sentences')
  .eq('unit_id', unit4);

for (const p of passages4) {
  const sents = [...p.sentences];
  let fixed = 0;

  for (let i = 0; i < sents.length; i++) {
    if (sents[i].original && sents[i].original.includes('writing system')) {
      const oldKr = sents[i].korean;
      const newKr = oldKr.replace('문자가 없어서', '문자 체계가 없어서');
      if (oldKr !== newKr) {
        sents[i] = { ...sents[i], korean: newKr };
        console.log(`  4과 [${i+1}] "${sents[i].original.substring(0, 60)}..."`);
        console.log(`       "${oldKr}" → "${newKr}"`);
        fixed++;
      }
    }
  }

  if (fixed > 0) {
    const { error } = await sb.from('naesin_passages').update({ sentences: sents }).eq('id', p.id);
    console.log(error ? `  ❌ ${error.message}` : `  ✅ 저장 완료`);
  }
}

// 3과 본문 - "기름" → "특수 용제" (Dry cleaning uses oil)
const { data: passages3 } = await sb
  .from('naesin_passages')
  .select('id, title, sentences')
  .eq('unit_id', unit3);

for (const p of passages3) {
  const sents = [...p.sentences];
  let fixed = 0;

  for (let i = 0; i < sents.length; i++) {
    if (sents[i].original && sents[i].original.includes('Dry cleaning')) {
      const oldKr = sents[i].korean;
      console.log(`  3과 [${i+1}] "${sents[i].original.substring(0, 60)}"`);
      console.log(`       현재: "${oldKr}"`);
      // "oil"은 원문 그대로지만, 드라이클리닝 맥락에서 "기름" → "용제(기름)"
      const newKr = oldKr.replace('기름', '용제(기름)');
      if (oldKr !== newKr) {
        sents[i] = { ...sents[i], korean: newKr };
        console.log(`       수정: "${newKr}"`);
        fixed++;
      }
    }
  }

  if (fixed > 0) {
    const { error } = await sb.from('naesin_passages').update({ sentences: sents }).eq('id', p.id);
    console.log(error ? `  ❌ ${error.message}` : `  ✅ 저장 완료`);
  }
}
