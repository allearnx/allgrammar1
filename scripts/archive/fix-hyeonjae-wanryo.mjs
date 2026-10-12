/**
 * 현재완료 Step1/2/3 검수 수정. 시드 템플릿 + source_template_id 복사 시트 전부 동기화.
 *   node scripts/fix-hyeonjae-wanryo.mjs [--apply]
 *
 * Step2 Q63 🔴: 정답 ①(has gone)→②(has been). "bought vegetables for us"=갔다 돌아옴=has been(해설과 일치)
 * Step1 Q91 🟡: 오류수정 대표정답 "were"→"went" ("were to the party"는 비문, accepted에 went 이미 있음 → 채점 무영향)
 * Step3: 수정 없음. 재채점: Step2 시도 시트(MCQ)만.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const S1_TMPL = JSON.parse(readFileSync('/tmp/hp_step1.json', 'utf8')).id;
const S2_TMPL = JSON.parse(readFileSync('/tmp/hp_step2.json', 'utf8')).id;

// MCQ regrade helper
const CIRC = { '①':'1','②':'2','③':'3','④':'4','⑤':'5' };
const uncircle = (s) => String(s).replace(/[①②③④⑤]+/g, (m) => [...m].map((c) => CIRC[c] ?? c).join(','));
function normMulti(s){const p=String(s).split(',').map(v=>v.trim());if(p.length<=1)return String(s).trim().toLowerCase();if(p.every(x=>/^\d+$/.test(x)))return p.sort((a,b)=>+a-+b).join(', ');return p.map(x=>x.toLowerCase()).sort().join(', ');}
function matchMcq(u0,c0,opt){const u=uncircle(u0).trim().toLowerCase(),c=uncircle(c0).trim().toLowerCase();if(u===c)return true;if(c.includes(',')||u.includes(','))if(normMulti(u)===normMulti(c))return true;if(!opt||!opt.length)return false;const i=parseInt(u,10);if(!isNaN(i)&&i>=1&&i<=opt.length&&opt[i-1].trim().toLowerCase()===c)return true;const ci=parseInt(c,10);if(!isNaN(ci)&&ci>=1&&ci<=opt.length&&opt[ci-1].trim().toLowerCase()===u)return true;return false;}
const extractAnswer = (v) => v == null ? '' : typeof v === 'object' && 'answer' in v ? String(v.answer ?? '') : String(v);

async function regradeMcq(sheetId) {
  const { data: sheet } = await sb.from('naesin_problem_sheets').select('id, unit_id, answer_key, questions, mode, category').eq('id', sheetId).single();
  const { data: attempts } = await sb.from('naesin_problem_attempts').select('id, student_id, answers, score, total_questions').eq('sheet_id', sheetId).order('created_at');
  if (!attempts?.length) return;
  const ak = sheet.answer_key, qs = sheet.questions, stage = sheet.category === 'mock_exam' ? 'mockExam' : 'problem';
  for (const at of attempts) {
    let correct = 0; const wrongs = [];
    for (let i = 0; i < at.total_questions; i++) { const ua = String((at.answers||[])[i] ?? ''); const ca = extractAnswer(ak[i]); const q = qs[i];
      if (matchMcq(ua, ca, q?.options)) correct++; else wrongs.push({ number: i+1, userAnswer: (at.answers||[])[i] ?? '', correctAnswer: ca, question: q?.question }); }
    const ns = Math.round((correct/at.total_questions)*100);
    console.log(`    [${sheetId.slice(0,8)}] stu=${at.student_id.slice(0,8)} ${at.score}→${ns} (오답 ${wrongs.length})`);
    if (!APPLY) continue;
    await sb.from('naesin_problem_attempts').update({ score: ns, wrong_answers: wrongs }).eq('id', at.id);
    await sb.from('naesin_wrong_answers').delete().eq('student_id', at.student_id).eq('sheet_id', sheetId);
    if (wrongs.length) await sb.from('naesin_wrong_answers').insert(wrongs.map((wa)=>{const q=qs[wa.number-1];return {student_id:at.student_id,unit_id:sheet.unit_id,stage,source_type:sheet.mode,question_data:{...wa,...(q?.options?{options:q.options}:{})},sheet_id:sheetId};}));
  }
}

async function fixGroup(tmplId, fixFn, label) {
  const { data: sheets } = await sb.from('naesin_problem_sheets').select('id').eq('source_template_id', tmplId);
  const targets = [['template', tmplId, 'naesin_templates'], ...sheets.map((s) => ['sheet', s.id, 'naesin_problem_sheets'])];
  const backup = {};
  for (const [lab, id, table] of targets) {
    const { data, error } = await sb.from(table).select('questions, answer_key').eq('id', id).single();
    if (error) { console.error(lab, id, error); continue; }
    backup[`${lab}_${id}`] = JSON.parse(JSON.stringify(data));
    const warns = []; fixFn(data.questions, data.answer_key, warns);
    if (warns.length) { console.log(`  [${label} ${lab} ${id.slice(0,8)}]`); warns.forEach((w) => console.log('   ', w)); }
    if (APPLY) { const { error: e } = await sb.from(table).update({ questions: data.questions, answer_key: data.answer_key }).eq('id', id); if (e) console.error(e); }
  }
  console.log(`[${label}] 템플릿+${sheets.length}시트 처리`);
  return backup;
}

const backups = {};
// Step2 Q63: ①→②
backups.step2 = await fixGroup(S2_TMPL, (qs, ak, w) => {
  const q = qs.find((x) => x.number === 63);
  if (!q || !/Is your mom home/.test(q.question)) { w.push('⚠ Q63 미매칭'); return; }
  if (q.answer !== '1') w.push(`⚠ Q63 현재 정답이 1 아님(${q.answer})`);
  q.answer = '2'; ak[62] = '2';
}, 'Step2');
// Step1 Q91: were→went
backups.step1 = await fixGroup(S1_TMPL, (qs, ak, w) => {
  const q = qs.find((x) => x.number === 91);
  if (!q || !/have been<\/u> to the party last night/.test(q.question)) { w.push('⚠ Q91 미매칭'); return; }
  if (q.answer !== 'were') w.push(`⚠ Q91 현재 정답이 were 아님(${q.answer})`);
  q.answer = 'went'; ak[90] = 'went';
}, 'Step1');

writeFileSync(new URL('../scripts/hyeonjae-wanryo-backup.json', import.meta.url), JSON.stringify(backups, null, 2));
console.log('\n=== 재채점 (Step2 시도 시트) ===');
const { data: s2sheets } = await sb.from('naesin_problem_sheets').select('id').eq('source_template_id', S2_TMPL);
for (const s of s2sheets) await regradeMcq(s.id);
console.log(APPLY ? '\n✓ 적용 완료 (백업: scripts/hyeonjae-wanryo-backup.json)' : '\n[dry-run] --apply 로 적용');
