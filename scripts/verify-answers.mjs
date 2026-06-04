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
if (!unitIds.length) { console.log('Usage: node verify-answers.mjs <unitId1> [unitId2] ...'); process.exit(1); }

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, unit_id, title, questions')
  .in('unit_id', unitIds)
  .order('title');

console.log(`총 ${sheets.length}개 시험지, ${sheets.reduce((a, s) => a + s.questions.length, 0)}문제 검증 시작\n`);

async function verifyBatch(questions, title) {
  const prompt = questions.map(q => {
    const p = [`[문제 ${q.number}]`, `문제: ${q.question}`];
    if (q.choices && q.choices.length) p.push(`선택지: ${q.choices.map((c, i) => `${i + 1}) ${c}`).join('  ')}`);
    p.push(`저장된 정답: ${q.answer}`);
    return p.join('\n');
  }).join('\n\n');

  const r = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: `중학교 영어 문법 문제의 정답이 맞는지 검증해주세요.

각 문제를 직접 풀어보고, 저장된 정답이 틀린 경우만 보고해주세요.
정답이 맞으면 보고하지 마세요.

반드시 순수 JSON 배열만 출력하세요:
- 틀린 문제가 있으면: [{"number": 문제번호, "storedAnswer": "저장된답", "correctAnswer": "올바른답", "reason": "이유"}]
- 모두 맞으면: []

시험지: ${title}

${prompt}` }],
  });

  const match = r.content[0].text.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  return JSON.parse(match[0]);
}

let totalWrong = 0;

for (const sheet of sheets) {
  const qs = sheet.questions;
  const batches = [];
  for (let i = 0; i < qs.length; i += 25) batches.push(qs.slice(i, i + 25));

  let sheetWrong = [];
  for (let bi = 0; bi < batches.length; bi++) {
    const wrong = await verifyBatch(batches[bi], sheet.title);
    if (wrong.length > 0) sheetWrong.push(...wrong);
    process.stdout.write(`  ${sheet.title} 배치 ${bi + 1}/${batches.length} (${wrong.length}건 의심)\n`);
  }

  if (sheetWrong.length === 0) {
    console.log(`  → ${sheet.title}: ${qs.length}문제 ✅\n`);
  } else {
    console.log(`  → ${sheet.title}: ⚠️ ${sheetWrong.length}건 정답 의심`);
    for (const w of sheetWrong) {
      console.log(`    Q${w.number}: 저장="${w.storedAnswer}" → 올바른="${w.correctAnswer}" | ${w.reason}`);
    }
    console.log();
    totalWrong += sheetWrong.length;
  }
}

console.log(`\n========== 종합 ==========`);
console.log(`정답 의심: ${totalWrong}건 ${totalWrong === 0 ? '✅ 전부 정답 확인' : '⚠️ 확인 필요'}`);
