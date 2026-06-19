/**
 * 개별보기 진짜 복수정답 누락 — 사람(나)이 한 문항씩 직접 풀어 확정한 명시 목록만 수정.
 * (휴리스틱/배치 아님. no-batch-answerkey-change 규칙 준수.)
 *   node scripts/fix-genuine-undercount.mjs [--apply]
 * 백업 + source_template_id 동기화 + 시도 시트는 production 채점기 관대 재채점.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// rootId(템플릿 또는 단독시트) → [{number, answer}]  — 전부 내가 직접 풀어 확정
const FIXES = {
  'c9b332f6-b798-4a64-b96d-4da0187b9ab6': [{ n: 33, a: '3, 4' }], // the+비교급 Step1
  'aa026294-d5f0-48ab-850b-5484922e3b72': [{ n: 8, a: '3, 5' }],  // 관계부사 Step1
  'c29ab3ae-84f3-4da8-a471-ec87feda38b5': [{ n: 10, a: '2, 5' }], // Lesson2 예상 Step2
  'af29a066-bbb2-49a7-b76e-ca2ce7694eb4': [{ n: 6, a: '1, 4' }, { n: 12, a: '2, 3' }], // Lesson4 예상 Step3
  '99799020-9fb9-444b-9938-74d6894e0063': [{ n: 25, a: '1, 5' }], // Lesson1 예상 Step5
  '8bf250f5-128d-45bc-b6f7-564132211a6b': [{ n: 7, a: '3, 5' }, { n: 8, a: '4, 5' }, { n: 19, a: '1, 5' }], // Lesson3 예상 Step3
  'dd781440-b2f1-4f56-959d-335376035a47': [{ n: 4, a: '1, 5' }, { n: 5, a: '1, 4' }, { n: 7, a: '4, 5' }, { n: 11, a: '3, 5' }, { n: 20, a: '2, 5' }, { n: 23, a: '1, 2' }, { n: 25, a: '1, 5' }], // Lesson3 예상 Step2 A
  '36d9497b-ea6c-4a35-8b13-e1dc1d0e1a1f': [{ n: 4, a: '2, 4' }, { n: 8, a: '4, 5' }, { n: 14, a: '4, 5' }, { n: 15, a: '4, 5' }, { n: 23, a: '1, 5' }, { n: 27, a: '3, 5' }], // Lesson3 예상 Step2 B
};

// production 채점기 미러(MCQ만 충분 — 이 문항들 전부 객관식)
const CIRC = { '①':'1','②':'2','③':'3','④':'4','⑤':'5','⑥':'6','⑦':'7','⑧':'8','⑨':'9','⑩':'10' };
const unc = (s) => String(s).replace(/[①②③④⑤⑥⑦⑧⑨⑩]+/g, (m) => [...m].map((c) => CIRC[c] ?? c).join(','));
function normMulti(s){const p=String(s).split(',').map(v=>v.trim());if(p.length<=1)return String(s).trim().toLowerCase();if(p.every(x=>/^\d+$/.test(x)))return p.sort((a,b)=>+a-+b).join(', ');return p.map(x=>x.toLowerCase()).sort().join(', ');}
function matchMcq(u0,c0,opt){const u=unc(u0).trim().toLowerCase(),c=unc(c0).trim().toLowerCase();if(u===c)return true;if(c.includes(',')||u.includes(','))if(normMulti(u)===normMulti(c))return true;if(!opt||!opt.length)return false;const i=parseInt(u,10);if(!isNaN(i)&&i>=1&&i<=opt.length&&opt[i-1].trim().toLowerCase()===c)return true;return false;}
const extractAns=(v)=>v==null?'':typeof v==='object'&&'answer' in v?String(v.answer??''):String(v);
const lenient=(ua,set)=>{const u=String(ua??'').split(',').map(x=>x.trim()).filter(x=>/^\d+$/.test(x)).map(Number);return u.length>0&&u.every(x=>set.has(x));};

async function run() {
  const backup = {}; const convertedBySheet = new Map();
  for (const [rootId, fixes] of Object.entries(FIXES)) {
    const { data: tmpl } = await sb.from('naesin_templates').select('id, questions, answer_key').eq('id', rootId).maybeSingle();
    const { data: copies } = await sb.from('naesin_problem_sheets').select('id, questions, answer_key').eq('source_template_id', rootId);
    const { data: self } = tmpl ? { data: null } : await sb.from('naesin_problem_sheets').select('id, questions, answer_key').eq('id', rootId).maybeSingle();
    const targets = [];
    if (tmpl) targets.push(['naesin_templates', tmpl]);
    for (const c of (copies || [])) targets.push(['naesin_problem_sheets', c]);
    if (self) targets.push(['naesin_problem_sheets', self]);
    for (const [table, row] of targets) {
      backup[`${table}_${row.id}`] = JSON.parse(JSON.stringify({ questions: row.questions, answer_key: row.answer_key }));
      for (const f of fixes) {
        const idx = row.questions.findIndex((x) => x.number === f.n); if (idx < 0) continue;
        const before = row.questions[idx].answer;
        row.questions[idx].answer = f.a; row.questions[idx].type = 'multi_choice'; row.answer_key[idx] = f.a;
        if (table === 'naesin_problem_sheets') { if (!convertedBySheet.has(row.id)) convertedBySheet.set(row.id, new Map()); convertedBySheet.get(row.id).set(f.n, new Set(f.a.split(',').map(x => +x.trim()))); }
        console.log(`  ${table.includes('templates')?'TMPL':'SHEET'} ${row.id.slice(0,8)} Q${f.n}: "${before}"→"${f.a}"`);
      }
      if (APPLY) await sb.from(table).update({ questions: row.questions, answer_key: row.answer_key }).eq('id', row.id);
    }
  }
  console.log(`\n수정 대상: ${Object.values(FIXES).flat().length}문항 × 아티팩트`);
  if (!APPLY) { console.log('[dry-run]'); return; }
  writeFileSync(new URL('../scripts/genuine-undercount-backup.json', import.meta.url), JSON.stringify(backup, null, 2));

  console.log('\n=== 시도 시트 재채점(관대) ===');
  for (const [sheetId, convMap] of convertedBySheet) {
    const { data: sheet } = await sb.from('naesin_problem_sheets').select('id, unit_id, answer_key, questions, mode, category').eq('id', sheetId).single();
    const { data: attempts } = await sb.from('naesin_problem_attempts').select('id, student_id, answers, score, total_questions').eq('sheet_id', sheetId).order('created_at');
    if (!attempts?.length) continue;
    const ak = sheet.answer_key, qs = sheet.questions, stage = sheet.category === 'mock_exam' ? 'mockExam' : 'problem';
    for (const at of attempts) {
      let correct = 0; const wrongs = [];
      for (let i = 0; i < at.total_questions; i++) {
        const ua = (at.answers || [])[i]; const q = qs[i]; const qn = q?.number;
        let ok; if (qn != null && convMap.has(qn)) ok = lenient(ua, convMap.get(qn));
        else { const ca = extractAns(ak[i]); ok = q?.options?.length ? matchMcq(String(ua ?? ''), ca, q.options) : false;
          if (!ok && q?.acceptedAnswers?.length) ok = q.acceptedAnswers.some((c) => String(c).trim().toLowerCase() === String(ua ?? '').trim().toLowerCase()); }
        if (ok) correct++; else wrongs.push({ number: i + 1, userAnswer: ua ?? '', correctAnswer: extractAns(ak[i]), question: q?.question });
      }
      const ns = Math.round((correct / at.total_questions) * 100);
      console.log(`  [${sheet.id.slice(0,8)}] stu=${at.student_id.slice(0,8)} ${at.score}→${ns}`);
      await sb.from('naesin_problem_attempts').update({ score: ns, wrong_answers: wrongs }).eq('id', at.id);
      await sb.from('naesin_wrong_answers').delete().eq('student_id', at.student_id).eq('sheet_id', sheetId);
      if (wrongs.length) await sb.from('naesin_wrong_answers').insert(wrongs.map((wa) => { const q = qs[wa.number - 1]; return { student_id: at.student_id, unit_id: sheet.unit_id, stage, source_type: sheet.mode, question_data: { ...wa, ...(q?.options ? { options: q.options } : {}) }, sheet_id: sheetId }; }));
    }
  }
  console.log('\n✓ 완료 (백업: scripts/genuine-undercount-backup.json)');
}
await run();
