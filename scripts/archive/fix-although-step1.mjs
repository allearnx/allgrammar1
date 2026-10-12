/**
 * 접속사 although Step1 — 정답키/콘텐츠 오류 수정 + 재채점.
 * 대상: 템플릿 9dd66098 + 복사 시트 ca11e985 (questions 동일).
 *
 *   node scripts/fix-although-step1.mjs           # dry-run
 *   node scripts/fix-although-step1.mjs --apply   # 실제 적용 + 재채점
 *
 * 수정 내용:
 *  Q4  : 지문 "exhausted"→"excited" (정답 ④ because 유지, 인과 성립)
 *  Q11 : 해설 복붙 오류 → 올바른 해설 (정답 ⑤ 유지)
 *  Q31 : 정답 ②→③ (③만 because, 나머지 although) + 해설 수정
 *  Q32 : 정답 ③→② (②만 because, 나머지 although) + 해설 수정
 *  Q39 : 보기② "a good grade"→"a bad grade" (정답 ⑤ 유지, 보기 자연스럽게)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TEMPLATE_ID = '9dd66098-82e5-4939-a45e-a3076ca23f21';
const SHEET_ID = 'ca11e985-c0f7-4233-8db2-2f1fe63261a0';

const NEW_EXPL = {
  4: "밤늦게까지 깨어 있었던 이유가 '매우 들떠 있었기(excited) 때문'이므로 인과관계의 'because(왜냐하면)'가 적절합니다.",
  11: "(A)는 'all her efforts'라는 명사구가 오므로 전치사 'despite(~에도 불구하고)'가 적절하고, (B)는 'Betty가 떠났지만 여전히 그립다'는 대조이므로 양보 접속사 'Though'가 적절합니다.",
  31: "③ '교통이 혼잡함에도 늦게 도착했다'가 아니라 '혼잡해서 늦었다'는 인과관계(because)이고, 나머지 ①②④⑤는 모두 '~함에도 불구하고'의 대조(though/although) 의미이다. 따라서 ③만 다르다.",
  32: "② '밤을 새워서 두통이 있었다'만 인과관계(because)이고, 나머지 ①③④⑤는 '~함에도 불구하고'의 대조(though/although) 의미이다. 따라서 ②만 다르다.",
};

function applyEdits(questions, answerKey) {
  const log = [];
  for (const q of questions) {
    if (q.number === 4) {
      const before = q.question;
      q.question = q.question.replace(/exhausted/g, 'excited');
      q.explanation = NEW_EXPL[4];
      if (before !== q.question) log.push('Q4 지문 exhausted→excited');
    } else if (q.number === 11) {
      q.explanation = NEW_EXPL[11];
      log.push('Q11 해설 교정');
    } else if (q.number === 31) {
      log.push(`Q31 정답 ${q.answer}→3`);
      q.answer = '3';
      q.explanation = NEW_EXPL[31];
    } else if (q.number === 32) {
      log.push(`Q32 정답 ${q.answer}→2`);
      q.answer = '2';
      q.explanation = NEW_EXPL[32];
    } else if (q.number === 39) {
      const b = q.options[1];
      q.options[1] = q.options[1].replace('a good grade', 'a bad grade');
      if (b !== q.options[1]) log.push('Q39 보기② good→bad grade');
    }
  }
  // answer_key 동기화 (index 30=Q31, 31=Q32)
  log.push(`answer_key[30] ${answerKey[30]}→3, [31] ${answerKey[31]}→2`);
  answerKey[30] = '3';
  answerKey[31] = '2';
  return log;
}

async function fixContent() {
  const backup = {};
  for (const [label, id, table] of [['template', TEMPLATE_ID, 'naesin_templates'], ['sheet', SHEET_ID, 'naesin_problem_sheets']]) {
    const { data, error } = await sb.from(table).select('questions, answer_key').eq('id', id).single();
    if (error) { console.error(label, error); process.exit(1); }
    backup[label] = JSON.parse(JSON.stringify(data));
    const log = applyEdits(data.questions, data.answer_key);
    console.log(`\n[${label} ${id}] 변경:`);
    log.forEach((l) => console.log('   -', l));
    if (APPLY) {
      const { error: upErr } = await sb.from(table).update({ questions: data.questions, answer_key: data.answer_key }).eq('id', id);
      if (upErr) { console.error('update 실패', label, upErr); process.exit(1); }
      console.log(`   ✓ 저장됨`);
    }
  }
  writeFileSync(new URL('../scripts/although-step1-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log('\n백업: scripts/although-step1-backup.json');
}

// ── 재채점용 (normalize-answer.ts 미러) ──
const CIRCLED = { '①':'1','②':'2','③':'3','④':'4','⑤':'5','⑥':'6','⑦':'7','⑧':'8','⑨':'9','⑩':'10' };
const uncircle = (s) => String(s).replace(/[①②③④⑤⑥⑦⑧⑨⑩]+/g, (m) => [...m].map((c) => CIRCLED[c] ?? c).join(','));
function normMulti(s) {
  const parts = String(s).split(',').map((v) => v.trim());
  if (parts.length <= 1) return String(s).trim().toLowerCase();
  if (parts.every((p) => /^\d+$/.test(p))) return parts.sort((a, b) => +a - +b).join(', ');
  return parts.map((p) => p.toLowerCase()).sort().join(', ');
}
function matchMcq(userAnswer, correctAnswer, options) {
  const u = uncircle(userAnswer).trim().toLowerCase();
  const c = uncircle(correctAnswer).trim().toLowerCase();
  if (u === c) return true;
  if (c.includes(',') || u.includes(',')) { if (normMulti(u) === normMulti(c)) return true; }
  if (!options || options.length === 0) return false;
  const idx = parseInt(u, 10);
  if (!isNaN(idx) && idx >= 1 && idx <= options.length && options[idx - 1].trim().toLowerCase() === c) return true;
  const cidx = parseInt(c, 10);
  if (!isNaN(cidx) && cidx >= 1 && cidx <= options.length && options[cidx - 1].trim().toLowerCase() === u) return true;
  return false;
}
const extractAnswer = (v) => v == null ? '' : typeof v === 'object' && 'answer' in v ? String(v.answer ?? '') : String(v);

async function regrade() {
  const { data: sheet } = await sb.from('naesin_problem_sheets').select('id, unit_id, answer_key, questions, mode, category').eq('id', SHEET_ID).single();
  const answerKey = sheet.answer_key;
  const questions = sheet.questions;
  const wrongStage = sheet.category === 'mock_exam' ? 'mockExam' : 'problem';
  const { data: attempts } = await sb.from('naesin_problem_attempts').select('id, student_id, answers, score, total_questions, wrong_answers').eq('sheet_id', SHEET_ID).order('created_at', { ascending: true });
  console.log(`\n=== 재채점: 시도 ${ (attempts || []).length }건 ===`);
  for (const at of (attempts || [])) {
    const answers = at.answers || [];
    let correct = 0;
    const wrongs = [];
    for (let i = 0; i < at.total_questions; i++) {
      const ua = String(answers[i] ?? '');
      const ca = extractAnswer(answerKey[i]);
      const q = questions[i];
      const ok = matchMcq(ua, ca, q?.options);
      if (ok) correct++; else wrongs.push({ number: i + 1, userAnswer: answers[i] ?? '', correctAnswer: ca, question: q?.question });
    }
    const newScore = Math.round((correct / at.total_questions) * 100);
    console.log(`  stu=${at.student_id.slice(0,8)} score ${at.score}→${newScore} (correct ${correct}/${at.total_questions}), 오답 ${wrongs.length}개`);
    if (!APPLY) continue;
    await sb.from('naesin_problem_attempts').update({ score: newScore, wrong_answers: wrongs }).eq('id', at.id);
    await sb.from('naesin_wrong_answers').delete().eq('student_id', at.student_id).eq('sheet_id', SHEET_ID);
    if (wrongs.length > 0) {
      const rows = wrongs.map((wa) => {
        const q = questions[wa.number - 1];
        return { student_id: at.student_id, unit_id: sheet.unit_id, stage: wrongStage, source_type: sheet.mode,
          question_data: { ...wa, ...(q?.options ? { options: q.options } : {}), ...(q?.explanation ? { explanation: q.explanation } : {}) }, sheet_id: SHEET_ID };
      });
      await sb.from('naesin_wrong_answers').insert(rows);
    }
    console.log('   ✓ attempts + wrong_answers 갱신');
  }
}

await fixContent();
if (APPLY) await regrade();
else { console.log('\n[dry-run] --apply 로 실제 적용 + 재채점'); }
