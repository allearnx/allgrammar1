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
if (!unitIds.length) { console.log('Usage: node gen-explanations.mjs <unitId1> [unitId2] ...'); process.exit(1); }

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, unit_id, title, questions')
  .in('unit_id', unitIds)
  .order('title');

const toFix = [];
for (const s of sheets) {
  const missing = (s.questions || []).filter(q => !q.explanation || !q.explanation.trim()).length;
  if (missing > 0) {
    toFix.push({ ...s, missingCount: missing });
    console.log(`${s.title}: ${missing}개 누락`);
  }
}
const total = toFix.reduce((a, s) => a + s.missingCount, 0);
if (total === 0) { console.log('해설 누락 없음 ✅'); process.exit(0); }
console.log(`총 ${total}개 생성 필요\n`);

async function genExp(questions, title) {
  const batches = [];
  for (let i = 0; i < questions.length; i += 25) batches.push(questions.slice(i, i + 25));
  const all = {};
  for (let bi = 0; bi < batches.length; bi++) {
    const prompt = batches[bi].map(q => {
      const p = [`[문제 ${q.number}]`, `유형: ${q.type === 'mcq' ? '객관식' : '주관식'}`, `문제: ${q.question}`];
      if (q.choices && q.choices.length) p.push(`선택지: ${q.choices.map((c, i) => `${i + 1}) ${c}`).join('  ')}`);
      p.push(`정답: ${q.answer}`);
      return p.join('\n');
    }).join('\n\n');

    const r = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: `다음 영어 문법 문제들의 해설을 작성해주세요.\n\n규칙:\n- 각 문제에 대해 1~3문장으로 간결하게 설명\n- 왜 그 답이 맞는지 문법적 근거를 제시\n- 학생이 이해하기 쉬운 한국어로 작성\n- 반드시 순수 JSON 배열만 출력: [{"number": 문제번호, "explanation": "해설"}]\n\n시험지: ${title}\n\n${prompt}` }],
    });
    const match = r.content[0].text.match(/\[[\s\S]*\]/);
    if (!match) { console.error(`  ${title} 배치 ${bi + 1} JSON 실패`); continue; }
    for (const e of JSON.parse(match[0])) all[e.number] = e.explanation;
    console.log(`  ${title} 배치 ${bi + 1}/${batches.length}: ${Object.keys(all).length}개`);
  }
  return all;
}

async function processSheet(sheet) {
  const qs = sheet.questions;
  const need = [], idxMap = {};
  for (let i = 0; i < qs.length; i++) {
    if (!qs[i].explanation || !qs[i].explanation.trim()) {
      need.push(qs[i]);
      idxMap[qs[i].number || i + 1] = i;
    }
  }
  if (!need.length) return;
  const exps = await genExp(need, sheet.title);
  const updated = [...qs];
  let applied = 0;
  for (const [num, exp] of Object.entries(exps)) {
    const idx = idxMap[Number(num)];
    if (idx !== undefined && exp) { updated[idx] = { ...updated[idx], explanation: exp }; applied++; }
  }
  const { error } = await sb.from('naesin_problem_sheets').update({ questions: updated }).eq('id', sheet.id);
  console.log(error ? `  ❌ ${sheet.title}: ${error.message}` : `  ✅ ${sheet.title}: ${applied}개 저장`);
}

for (let i = 0; i < toFix.length; i += 2) {
  await Promise.all(toFix.slice(i, i + 2).map(processSheet));
}

// Verify
console.log('\n=== 검증 ===');
const { data: verify } = await sb.from('naesin_problem_sheets').select('title, questions').in('unit_id', unitIds).order('title');
let tQ = 0, tNoExp = 0;
for (const s of verify) {
  const qs = s.questions || [];
  tQ += qs.length;
  const noExp = qs.filter(q => !q.explanation || !q.explanation.trim()).length;
  tNoExp += noExp;
  console.log(`  ${s.title}: ${qs.length}문제 ${noExp ? '⚠️ 해설없음 ' + noExp : '✅'}`);
}
console.log(`\n총 ${tQ}문제, 해설 누락: ${tNoExp} ${tNoExp === 0 ? '✅' : '❌'}`);
