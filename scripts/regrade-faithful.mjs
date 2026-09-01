/**
 * regrade-sheet.ts를 충실히 복제한 재채점 (규칙 기반, AI 미사용 — 공식 재채점과 동일).
 * 제목으로 시트 찾아 전 시도 재채점 + 오답테이블 동기화.
 *   node scripts/regrade-faithful.mjs "<title-like>" [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const TITLE = process.argv[2];
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// ── normalize-answer.ts 포팅 ──
const extractAnswer = (v) => v == null ? '' : typeof v === 'string' ? v : typeof v === 'number' ? String(v) : (typeof v === 'object' && 'answer' in v ? String(v.answer ?? '') : '');
const C = { '①':'1','②':'2','③':'3','④':'4','⑤':'5','⑥':'6','⑦':'7','⑧':'8','⑨':'9','⑩':'10' };
const uncircle = (s) => String(s).replace(/[①②③④⑤⑥⑦⑧⑨⑩]+/g, (m) => [...m].map((c) => C[c] ?? c).join(','));
// normalize-answer.ts 현행 포팅 — 축약형 확장 포함 (2026-09-01 동기화: 구버전엔 축약 확장이 빠져
// 재채점 결과가 실서비스 채점과 달랐음. 이 스크립트 수정 시 normalize-answer.ts와 대조할 것)
const normalize = (s) => String(s).replace(/[\r\n\t]/g,' ').replace(/[‘’`´]/g,"'").replace(/[“”]/g,'"').replace(/[–—−]/g,'-').trim().toLowerCase()
  .replace(/\bcan't\b/g,'cannot').replace(/\bcan not\b/g,'cannot').replace(/\bwon't\b/g,'will not')
  .replace(/([a-z])n't\b/g,'$1 not').replace(/\bi'm\b/g,'i am').replace(/\b(you|we|they)'re\b/g,'$1 are')
  .replace(/\b(i|you|we|they|he|she|it|there|who|what)'ll\b/g,'$1 will').replace(/\b(i|you|we|they)'ve\b/g,'$1 have')
  .replace(/\b(it|that|there|he|she|what|who|where|when|how|here)'s\b/g,'$1 is')
  .replace(/\s+([?!.,;:])/g,'$1')
  .replace(/\.+\s*$/,'').replace(/\((\d+)\)\s*/g,'($1) ').replace(/\s*\/\s*/g,' / ').replace(/\s+/g,' ').trim();
const normalizeSeparators = (s) => normalize(s).replace(/\s*[,/]\s*/g,' ').replace(/\s+/g,' ').trim();
function normalizeMulti(s){const p=String(s).split(',').map(v=>v.trim());if(p.length<=1)return String(s).trim().toLowerCase();if(p.every(x=>/^\d+$/.test(x)))return p.sort((a,b)=>+a-+b).join(', ');return p.map(x=>x.toLowerCase()).sort().join(', ');}
function matchMcqAnswer(ua,ca,opts){const u=uncircle(ua).trim().toLowerCase(),c=uncircle(ca).trim().toLowerCase();if(u===c)return true;if(c.includes(',')||u.includes(','))if(normalizeMulti(u)===normalizeMulti(c))return true;if(!opts||!opts.length)return false;const i=parseInt(u,10);if(!isNaN(i)&&i>=1&&i<=opts.length&&opts[i-1].trim().toLowerCase()===c)return true;const ci=parseInt(c,10);if(!isNaN(ci)&&ci>=1&&ci<=opts.length&&opts[ci-1].trim().toLowerCase()===u)return true;return false;}
const wordPrefix=(w,p)=>p.length<=w.length&&p.every((x,i)=>w[i]===x);
const wordSuffix=(w,p)=>p.length<=w.length&&p.every((x,i)=>w[w.length-p.length+i]===x);
function isSubstringMatch(student,correct){const s=normalize(student),c=normalize(correct);if(s===c)return true;const sW=s.split(' '),cW=c.split(' ');if(sW.length<3)return false;if(wordPrefix(cW,sW)||wordSuffix(cW,sW))return sW.length/cW.length>=0.35;if(wordPrefix(sW,cW)||wordSuffix(sW,cW))return cW.length/sW.length>=0.35;const sn=s.replace(/\(\d+\)\s*/g,'').replace(/\s*\/\s*/g,' ').replace(/\s+/g,' ').trim();const cn=c.replace(/\(\d+\)\s*/g,'').replace(/\s*\/\s*/g,' ').replace(/\s+/g,' ').trim();if(sn===cn&&sn.split(' ').length>=2)return true;return false;}

function gradeAttempt(questions, answerKey, answers, total) {
  let correct = 0; const wrongs = [];
  for (let i = 0; i < total; i++) {
    const ua = String(answers[i] ?? ''); const ca = extractAnswer(answerKey[i]);
    const q = questions[i]; const subj = !q?.options || q.options.length === 0;
    let ok;
    if (subj) {
      if (q?.subParts) {
        const parts = ua.split(' / ');
        ok = q.subParts.every((sp, j) => { const sn = normalize(parts[j]?.trim() ?? ''); return [sp.answer, ...(sp.acceptedAnswers ?? [])].some((c) => normalize(c) === sn); });
        if (!ok) { const sn = normalize(ua); ok = [ca, ...(q?.acceptedAnswers ?? [])].some((c) => normalize(c) === sn); }
      } else {
        const sn = normalize(ua); const cands = [ca, ...(q?.acceptedAnswers ?? [])];
        ok = cands.some((c) => normalize(c) === sn);
        if (!ok) ok = cands.some((c) => normalizeSeparators(ua) === normalizeSeparators(c));
        if (!ok) ok = cands.some((c) => isSubstringMatch(ua, c));
      }
    } else {
      ok = matchMcqAnswer(ua, ca, q?.options);
      if (!ok && q?.acceptedAnswers?.length) { const sn = normalize(ua); ok = q.acceptedAnswers.some((c) => normalize(c) === sn); }
    }
    if (ok) correct++; else wrongs.push({ number: i + 1, userAnswer: answers[i] ?? '', correctAnswer: ca, question: q?.question });
  }
  return { correct, wrongs };
}

async function run() {
  const { data: sheets } = await sb.from('naesin_problem_sheets').select('id, unit_id, answer_key, questions, mode, category, title').ilike('title', TITLE);
  let touched = 0;
  for (const sheet of sheets) {
    const stage = sheet.category === 'mock_exam' ? 'mockExam' : 'problem';
    const { data: attempts } = await sb.from('naesin_problem_attempts').select('id, student_id, answers, score, total_questions').eq('sheet_id', sheet.id).order('created_at', { ascending: true });
    for (const at of (attempts || [])) {
      const { correct, wrongs } = gradeAttempt(sheet.questions, sheet.answer_key, at.answers || [], at.total_questions);
      const ns = Math.round((correct / at.total_questions) * 100);
      if (ns !== at.score) { console.log(`  [${sheet.title.slice(0,20)} ${sheet.id.slice(0,8)}] stu=${at.student_id.slice(0,8)} ${at.score}→${ns}`); touched++; }
      if (!APPLY) continue;
      await sb.from('naesin_problem_attempts').update({ score: ns, wrong_answers: wrongs }).eq('id', at.id);
      await sb.from('naesin_wrong_answers').delete().eq('student_id', at.student_id).eq('sheet_id', sheet.id);
      if (wrongs.length) await sb.from('naesin_wrong_answers').insert(wrongs.map((wa) => { const q = sheet.questions[wa.number - 1]; return { student_id: at.student_id, unit_id: sheet.unit_id, stage, source_type: sheet.mode, question_data: { ...wa, ...(q?.options ? { options: q.options } : {}), ...(q?.explanation ? { explanation: q.explanation } : {}), ...(q?.subParts ? { subParts: q.subParts } : {}) }, sheet_id: sheet.id }; }));
    }
  }
  console.log(APPLY ? `✓ 적용 (점수 변동 ${touched}건)` : `[dry-run] 점수 변동 예정 ${touched}건`);
}
await run();
