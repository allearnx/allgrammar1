import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const unitIds = process.argv.slice(2);
if (!unitIds.length) { console.log('Usage: node verify-content.mjs <unitId1> [unitId2]'); process.exit(1); }

async function askClaude(prompt) {
  const r = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  const match = r.content[0].text.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  return JSON.parse(match[0]);
}

// ========== 1. 단어 검증 ==========
console.log('=== 1. 단어 암기 검증 ===');
const { data: vocab } = await sb
  .from('naesin_vocabulary')
  .select('id, unit_id, front_text, back_text, sort_order')
  .in('unit_id', unitIds)
  .order('sort_order');

if (vocab && vocab.length > 0) {
  const batches = [];
  for (let i = 0; i < vocab.length; i += 40) batches.push(vocab.slice(i, i + 40));

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const prompt = batch.map((v, i) => `${i + 1}. ${v.front_text} = ${v.back_text}`).join('\n');

    const issues = await askClaude(`다음 영어 단어-한글 뜻 쌍이 맞는지 검증해주세요.
틀린 것만 보고해주세요. 맞으면 보고하지 마세요.
순수 JSON 배열만 출력: [{"index": 번호, "english": "영어", "stored_korean": "저장된뜻", "correct_korean": "올바른뜻", "reason": "이유"}]
모두 맞으면: []

${prompt}`);

    if (issues.length > 0) {
      for (const i of issues) {
        console.log(`  ⚠️ ${i.english}: "${i.stored_korean}" → "${i.correct_korean}" (${i.reason})`);
      }
    }
    console.log(`  배치 ${bi + 1}/${batches.length}: ${issues.length}건 의심`);
  }
} else {
  console.log('  단어 없음 (미입력)');
}

// ========== 2. 대화문 검증 ==========
console.log('\n=== 2. 대화문 암기 검증 ===');
const { data: dialogues } = await sb
  .from('naesin_dialogues')
  .select('id, unit_id, title, sentences')
  .in('unit_id', unitIds);

for (const d of (dialogues || [])) {
  const sents = d.sentences || [];
  if (!sents.length) continue;

  const batches = [];
  for (let i = 0; i < sents.length; i += 30) batches.push(sents.slice(i, i + 30).map((s, j) => ({ ...s, idx: i + j + 1 })));

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const prompt = batch.map(s => `[${s.idx}] ${s.original}\n   → ${s.korean}`).join('\n');

    const issues = await askClaude(`다음 영어 대화문과 한글 번역이 맞는지 검증해주세요.
번역이 틀리거나 크게 부자연스러운 것만 보고해주세요. 사소한 스타일 차이는 무시하세요.
순수 JSON 배열만 출력: [{"index": 번호, "english": "영어원문", "issue": "문제설명"}]
모두 맞으면: []

${prompt}`);

    if (issues.length > 0) {
      for (const i of issues) {
        console.log(`  ⚠️ [${i.index}] ${(i.english || '').substring(0, 50)}... → ${i.issue}`);
      }
    }
    console.log(`  ${d.title} 배치 ${bi + 1}/${batches.length}: ${issues.length}건 의심`);
  }
}
if (!dialogues || !dialogues.length) console.log('  대화문 없음 (미입력)');

// ========== 3. 본문 검증 ==========
console.log('\n=== 3. 본문 암기 검증 ===');
const { data: passages } = await sb
  .from('naesin_passages')
  .select('id, unit_id, title, sentences')
  .in('unit_id', unitIds);

for (const p of (passages || [])) {
  const sents = p.sentences || [];
  if (!sents.length) continue;

  const batches = [];
  for (let i = 0; i < sents.length; i += 30) batches.push(sents.slice(i, i + 30).map((s, j) => ({ ...s, idx: i + j + 1 })));

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const prompt = batch.map(s => `[${s.idx}] ${s.original}\n   → ${s.korean}`).join('\n');

    const issues = await askClaude(`다음 영어 본문과 한글 번역이 맞는지 검증해주세요.
번역이 틀리거나 크게 부자연스러운 것만 보고해주세요. 사소한 스타일 차이는 무시하세요.
순수 JSON 배열만 출력: [{"index": 번호, "english": "영어원문", "issue": "문제설명"}]
모두 맞으면: []

${prompt}`);

    if (issues.length > 0) {
      for (const i of issues) {
        console.log(`  ⚠️ [${i.index}] ${(i.english || '').substring(0, 50)}... → ${i.issue}`);
      }
    }
    console.log(`  ${p.title} 배치 ${bi + 1}/${batches.length}: ${issues.length}건 의심`);
  }
}
if (!passages || !passages.length) console.log('  본문 없음 (미입력)');

console.log('\n=== 검증 완료 ===');
