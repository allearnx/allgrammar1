import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Q44 from the+비교급 Step2
const unit4 = '55f67584-aa9a-42d3-8b27-5a40e050a9ea';
const { data: step2 } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions')
  .eq('unit_id', unit4)
  .ilike('title', '%비교급%Step2%')
  .single();

if (step2) {
  const q44 = step2.questions.find(x => x.number === 44);
  if (q44) {
    console.log('=== the+비교급 Step2 Q44 ===');
    console.log(`정답: "${q44.answer}"`);
    console.log(`문제: ${(q44.question || '').substring(0, 500)}`);
    if (q44.options?.length) q44.options.forEach((c, i) => console.log(`  ${i+1}) ${c}`));
    if (q44.acceptedAnswers) console.log(`허용: ${JSON.stringify(q44.acceptedAnswers)}`);
  }
}

// 사역동사 Step 3 — full check
const unit2 = '53685a6c-37ef-4ce9-b4d0-17d7b698cfb4';
const { data: step3 } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions')
  .eq('unit_id', unit2)
  .ilike('title', '%사역동사 Step 3%')
  .single();

if (step3) {
  console.log(`\n=== 사역동사 Step 3: ${step3.questions.length}문제 ===`);
  // Show a few questions for context
  for (const q of step3.questions.filter(x => x.number >= 41 && x.number <= 51)) {
    console.log(`\nQ${q.number}: 정답="${q.answer}"`);
    console.log(`  ${(q.question || '').substring(0, 300)}`);
    if (q.options?.length) q.options.forEach((c, i) => console.log(`  ${i+1}) ${(c||'').substring(0, 100)}`));
  }
}
