/**
 * 수동태 Step1 — 정답키/지시문/해설/밑줄/보기손상 수정 + 재채점.
 * 템플릿 1d3d85a9 + 복사 시트 4개. 시도 있는 시트(eb1d8db5, 756504a2) 재채점.
 *   node scripts/fix-sudongtae-step1.mjs           # dry-run
 *   node scripts/fix-sudongtae-step1.mjs --apply
 *
 * 🔴 정답키: Q21 "5"→"2, 5"(능동·수동 둘 다 정답), Q24 1→5, Q48 1→5, Q50 1→5
 * 🟡 Q11 지시문(능동→수동), Q13·Q20·Q24·Q48·Q50 해설, Q42 밑줄 <u>, Q45-50 보기 원형숫자 제거
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TEMPLATE_ID = '1d3d85a9-a01f-4572-a990-2124d2b0ee3c';
const SHEET_IDS = ['eb1d8db5-a078-405f-9bd0-0481255a7006', '55e8890f-9813-4a24-a8d3-f22e94ea306d', '756504a2-be07-4836-8dbb-238ccb6048c9', 'f9ca01ac-5e2c-489f-a0aa-ba40150602d4'];

const EXPL = {
  13: "수동태는 'is grown'이고, by 뒤 행위자는 목적격이어야 하므로 'is grown - her'가 맞다.",
  20: "능동 의문문 'Did Gaudi make Casa Mila?'의 수동태 의문문은 'Was Casa Mila made by Gaudi?'(⑤)이다.",
  21: "능동태 'Andersen wrote the fairy tale.'(②)와 과거 수동태 'The fairy tale was written by Andersen.'(⑤) 둘 다 올바른 영작이다.",
  24: "능동 의문문 'Did Cathy clean the room?'의 수동태는 'Was the room cleaned by Cathy?'(⑤)이다. ①은 수동태 구조가 아니다.",
  48: "(A) 과거 수동태 'was driven', (B) 'was given to', (C) 능동 과거 'invented' → ⑤가 맞다.",
  50: "(A) 과거 수동태 'was driven', (B) 'was given to', (C) 능동 과거 'invented' → ⑤가 맞다.",
};
const stripCircle = (s) => s.replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, '').replace(/\s+/g, ' ').trim();

function applyEdits(questions, answerKey, warns) {
  const log = []; const byNum = (n) => questions.find((q) => q.number === n);
  const rep = (q, f, from, to, lab) => { const b = q[f]; q[f] = b.split(from).join(to); if (b === q[f]) warns.push(`⚠ ${lab}: "${from}" 미발견`); };

  rep(byNum(11), 'question', '능동태로 전환', '수동태로 전환', 'Q11'); log.push('Q11 지시문 능동→수동');
  byNum(13).explanation = EXPL[13]; byNum(20).explanation = EXPL[20]; log.push('Q13·Q20 해설 교정');
  // Q21 복수정답
  { const q = byNum(21); q.answer = '2, 5'; answerKey[20] = '2, 5'; q.explanation = EXPL[21]; log.push('Q21 정답 5→"2, 5"'); }
  // Q24
  { const q = byNum(24); q.answer = '5'; answerKey[23] = '5'; q.explanation = EXPL[24]; log.push('Q24 정답 1→5'); }
  // Q42 밑줄
  { const q = byNum(42);
    rep(q, 'question', '(A)steal', '(A)<u>steal</u>', 'Q42a');
    rep(q, 'question', '(B)catch', '(B)<u>catch</u>', 'Q42b');
    rep(q, 'question', '(C)invite', '(C)<u>invite</u>', 'Q42c'); log.push('Q42 (A)(B)(C) <u> 밑줄'); }
  // Q45·46·47·48·50 보기 원형숫자 제거
  for (const n of [45, 46, 47, 48, 50]) { const q = byNum(n); if (q.options) q.options = q.options.map(stripCircle); }
  log.push('Q45·46·47·48·50 보기 원형숫자 제거');
  // Q48·Q50 정답
  { const q = byNum(48); q.answer = '5'; answerKey[47] = '5'; q.explanation = EXPL[48]; log.push('Q48 정답 1→5'); }
  { const q = byNum(50); q.answer = '5'; answerKey[49] = '5'; q.explanation = EXPL[50]; log.push('Q50 정답 1→5'); }
  return log;
}

// ── regrade helper (MCQ) ──
const CIRC = { '①':'1','②':'2','③':'3','④':'4','⑤':'5','⑥':'6','⑦':'7','⑧':'8','⑨':'9','⑩':'10' };
const uncircle = (s) => String(s).replace(/[①②③④⑤⑥⑦⑧⑨⑩]+/g, (m) => [...m].map((c) => CIRC[c] ?? c).join(','));
function normMulti(s){const p=String(s).split(',').map(v=>v.trim());if(p.length<=1)return String(s).trim().toLowerCase();if(p.every(x=>/^\d+$/.test(x)))return p.sort((a,b)=>+a-+b).join(', ');return p.map(x=>x.toLowerCase()).sort().join(', ');}
function matchMcq(u0,c0,opt){const u=uncircle(u0).trim().toLowerCase(),c=uncircle(c0).trim().toLowerCase();if(u===c)return true;if(c.includes(',')||u.includes(','))if(normMulti(u)===normMulti(c))return true;if(!opt||!opt.length)return false;const i=parseInt(u,10);if(!isNaN(i)&&i>=1&&i<=opt.length&&opt[i-1].trim().toLowerCase()===c)return true;const ci=parseInt(c,10);if(!isNaN(ci)&&ci>=1&&ci<=opt.length&&opt[ci-1].trim().toLowerCase()===u)return true;return false;}
const extractAnswer = (v) => v == null ? '' : typeof v === 'object' && 'answer' in v ? String(v.answer ?? '') : String(v);

async function regrade(sheetId) {
  const { data: sheet } = await sb.from('naesin_problem_sheets').select('id, unit_id, answer_key, questions, mode, category').eq('id', sheetId).single();
  const { data: attempts } = await sb.from('naesin_problem_attempts').select('id, student_id, answers, score, total_questions').eq('sheet_id', sheetId).order('created_at', { ascending: true });
  if (!attempts || !attempts.length) return;
  const ak = sheet.answer_key, qs = sheet.questions, stage = sheet.category === 'mock_exam' ? 'mockExam' : 'problem';
  for (const at of attempts) {
    let correct = 0; const wrongs = [];
    for (let i = 0; i < at.total_questions; i++) {
      const ua = String((at.answers || [])[i] ?? ''); const ca = extractAnswer(ak[i]); const q = qs[i];
      if (matchMcq(ua, ca, q?.options)) correct++; else wrongs.push({ number: i + 1, userAnswer: (at.answers || [])[i] ?? '', correctAnswer: ca, question: q?.question });
    }
    const ns = Math.round((correct / at.total_questions) * 100);
    console.log(`    [${sheetId.slice(0,8)}] stu=${at.student_id.slice(0,8)} ${at.score}→${ns} (오답 ${wrongs.length})`);
    if (!APPLY) continue;
    await sb.from('naesin_problem_attempts').update({ score: ns, wrong_answers: wrongs }).eq('id', at.id);
    await sb.from('naesin_wrong_answers').delete().eq('student_id', at.student_id).eq('sheet_id', sheetId);
    if (wrongs.length) await sb.from('naesin_wrong_answers').insert(wrongs.map((wa) => { const q = qs[wa.number - 1]; return { student_id: at.student_id, unit_id: sheet.unit_id, stage, source_type: sheet.mode, question_data: { ...wa, ...(q?.options ? { options: q.options } : {}), ...(q?.explanation ? { explanation: q.explanation } : {}) }, sheet_id: sheetId }; }));
  }
}

async function run() {
  const backup = {};
  for (const [label, id, table] of [['template', TEMPLATE_ID, 'naesin_templates'], ...SHEET_IDS.map((s) => ['sheet', s, 'naesin_problem_sheets'])]) {
    const { data, error } = await sb.from(table).select('questions, answer_key').eq('id', id).single();
    if (error) { console.error(label, id, error); process.exit(1); }
    backup[`${label}_${id}`] = JSON.parse(JSON.stringify(data));
    const warns = []; const log = applyEdits(data.questions, data.answer_key, warns);
    console.log(`\n[${label} ${id.slice(0,8)}] ${log.length}개 수정`); warns.forEach((w) => console.log('  ', w));
    if (APPLY) { const { error: e } = await sb.from(table).update({ questions: data.questions, answer_key: data.answer_key }).eq('id', id); if (e) { console.error(e); process.exit(1); } console.log('   ✓ 저장'); }
  }
  writeFileSync(new URL('../scripts/sudongtae-step1-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log('\n백업: scripts/sudongtae-step1-backup.json');
  console.log('\n=== 재채점 ===');
  for (const s of SHEET_IDS) await regrade(s);
  if (!APPLY) console.log('\n[dry-run] --apply 로 실제 적용+재채점');
}
await run();
