/**
 * 수동태 Step3 — ①~⑤가 문제 텍스트에만 있고 options가 없는 15문항을 클릭형 객관식으로 변환.
 * interactive 모드: options 있어야 라디오/체크박스 렌더. 없으면 서술형 텍스트박스로 떨어짐.
 * 대상: 템플릿 21327e51 + 연결 시트 933bcd0f (동기화).
 *   node scripts/fix-sudongtae-step3-interactive.mjs [--apply]
 *
 * 변환: 문제 텍스트의 ①~⑤ 블록 → options[]. 정답에 콤마 있으면 multi_choice(subParts 제거), 아니면 single_choice.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TEMPLATE_ID = '21327e51-a84a-4459-8873-be3df0598bc2';
const SHEET_ID = '933bcd0f-30f2-4972-88b7-3a7509133530';

function convert(questions, warns, sampleSink) {
  let n = 0;
  for (const q of questions) {
    const hasOpt = q.options && q.options.length > 0;
    if (hasOpt) continue;
    const a = String(q.answer || '').trim();
    if (!/^[\d,\s]+$/.test(a)) continue; // 번호 정답만 대상 (서술형 제외)
    const text = q.question || '';
    const firstMarker = text.search(/[①②③④⑤]/);
    if (firstMarker < 0) { warns.push(`⚠ Q${q.number}: ①~⑤ 마커 없음`); continue; }
    const instruction = text.slice(0, firstMarker).replace(/([?.])\s*\d{2,3}\)/g, '$1').trim();
    const body = text.slice(firstMarker);
    const opts = body.split(/(?=[①②③④⑤])/).map((p) => p.replace(/^[①②③④⑤]\s*/, '').trim()).filter(Boolean);
    if (opts.length !== 5) { warns.push(`⚠ Q${q.number}: 보기 ${opts.length}개(≠5) — 변환 보류`); continue; }
    q.question = instruction;
    q.options = opts;
    if (a.includes(',')) { q.type = 'multi_choice'; delete q.subParts; }
    else q.type = 'single_choice';
    n++;
    if (sampleSink && sampleSink.length < 2) sampleSink.push({ num: q.number, type: q.type, ans: q.answer, instruction, opt0: opts[0], opt3: opts[3] });
  }
  return n;
}

async function run() {
  const backup = {};
  const samples = [];
  for (const [label, id, table] of [['template', TEMPLATE_ID, 'naesin_templates'], ['sheet', SHEET_ID, 'naesin_problem_sheets']]) {
    const { data, error } = await sb.from(table).select('questions, answer_key').eq('id', id).single();
    if (error) { console.error(label, error); process.exit(1); }
    backup[`${label}_${id}`] = JSON.parse(JSON.stringify(data));
    const warns = [];
    const n = convert(data.questions, warns, label === 'template' ? samples : null);
    console.log(`[${label} ${id.slice(0,8)}] 변환 ${n}문항`); warns.forEach((w) => console.log('  ', w));
    if (APPLY) { const { error: e } = await sb.from(table).update({ questions: data.questions }).eq('id', id); if (e) { console.error(e); process.exit(1); } console.log('   ✓ 저장'); }
  }
  writeFileSync(new URL('../scripts/sudongtae-step3-interactive-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log('\n--- 변환 샘플(검증용) ---');
  for (const s of samples) {
    console.log(`Q${s.num} [${s.type}] 정답=${s.ans}`);
    console.log(`  지시문: ${s.instruction}`);
    console.log(`  보기①: ${s.opt0.replace(/\n/g,' ⏎ ')}`);
    console.log(`  보기④: ${s.opt3.replace(/\n/g,' ⏎ ')}`);
  }
  console.log(APPLY ? '\n✓ 적용 완료 (백업: scripts/sudongtae-step3-interactive-backup.json)' : '\n[dry-run] --apply 로 적용');
}
await run();
