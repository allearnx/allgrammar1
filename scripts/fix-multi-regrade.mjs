/**
 * MULTI_ANSWER_UNDERCOUNT 적용 후, 시도 있는 7시트를 production과 동일한 충실한 채점기로 재채점.
 * regrade-sheet.ts 로직 미러(matchMcqAnswer+acceptedAnswers+subParts+normalize) + 전환문항 관대 매칭.
 *   node scripts/fix-multi-regrade.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// ── normalize-answer.ts 미러 ──
const CIRC = { '①':'1','②':'2','③':'3','④':'4','⑤':'5','⑥':'6','⑦':'7','⑧':'8','⑨':'9','⑩':'10' };
const uncircle = (s) => String(s).replace(/[①②③④⑤⑥⑦⑧⑨⑩]+/g, (m) => [...m].map((c) => CIRC[c] ?? c).join(','));
function normalize(s){return String(s).replace(/[\r\n\t]/g,' ').replace(/[‘’`´]/g,"'").replace(/[“”]/g,'"').replace(/[–—−]/g,'-').trim().toLowerCase().replace(/\.+\s*$/,'').replace(/\((\d+)\)\s*/g,'($1) ').replace(/\s*\/\s*/g,' / ').replace(/\s+/g,' ').trim();}
function normalizeSeparators(s){return normalize(s).replace(/\s*[,/]\s*/g,' ').replace(/\s+/g,' ').trim();}
function normMulti(s){const p=String(s).split(',').map(v=>v.trim());if(p.length<=1)return String(s).trim().toLowerCase();if(p.every(x=>/^\d+$/.test(x)))return p.sort((a,b)=>+a-+b).join(', ');return p.map(x=>x.toLowerCase()).sort().join(', ');}
function matchMcqAnswer(u0,c0,opt){const u=uncircle(u0).trim().toLowerCase(),c=uncircle(c0).trim().toLowerCase();if(u===c)return true;if(c.includes(',')||u.includes(','))if(normMulti(u)===normMulti(c))return true;if(!opt||!opt.length)return false;const i=parseInt(u,10);if(!isNaN(i)&&i>=1&&i<=opt.length&&opt[i-1].trim().toLowerCase()===c)return true;const ci=parseInt(c,10);if(!isNaN(ci)&&ci>=1&&ci<=opt.length&&opt[ci-1].trim().toLowerCase()===u)return true;return false;}
function isSubstringMatch(student,correct){const s=normalize(student),c=normalize(correct);if(s===c)return true;const sw=s.split(' '),cw=c.split(' ');if(sw.length<3)return false;if(c.startsWith(s)||c.endsWith(s))return sw.length/cw.length>=0.35;if(s.startsWith(c)||s.endsWith(c))return cw.length/sw.length>=0.35;return false;}
const extractAns=(v)=>v==null?'':typeof v==='object'&&'answer' in v?String(v.answer??''):String(v);
// 관대: 전환문항 — 학생이 고른 번호들이 정답집합 부분집합이면 정답
function lenient(ua,set){const u=String(ua??'').split(',').map(x=>x.trim()).filter(x=>/^\d+$/.test(x)).map(Number);return u.length>0&&u.every(x=>set.has(x));}

// 전환맵: plan.json auto → sheet별 {qNum: Set}
const plan = JSON.parse(readFileSync(new URL('../scripts/multi-undercount-plan.json', import.meta.url), 'utf8'));

const SHEETS = ['a8a6cc34','1d92de7f','494438ca','c968c756','c44935f3','4ce87815','fac7853c'];

async function run() {
  // 각 시트의 전환문항 집합 구하기: 시트의 source_template_id(또는 자기) 가 plan auto의 rootId면 해당 number들
  for (const prefix of SHEETS) {
    const { data: rows } = await sb.from('naesin_problem_sheets').select('id, title, unit_id, mode, category, source_template_id, answer_key, questions').range(0, 9999);
    const sheet = rows.find((r) => r.id.startsWith(prefix));
    if (!sheet) { console.log(`⚠ ${prefix} 못찾음`); continue; }
    const rootId = (sheet.source_template_id && plan.auto.some((a) => a.rootId === sheet.source_template_id)) ? sheet.source_template_id : sheet.id;
    const convMap = new Map();
    for (const a of plan.auto) if (a.rootId === rootId) convMap.set(a.number, new Set(a.markerNums));
    const { data: attempts } = await sb.from('naesin_problem_attempts').select('id, student_id, answers, score, total_questions').eq('sheet_id', sheet.id).order('created_at');
    if (!attempts?.length) continue;
    const ak = sheet.answer_key, qs = sheet.questions, stage = sheet.category === 'mock_exam' ? 'mockExam' : 'problem';
    for (const at of attempts) {
      let correct = 0; const wrongs = [];
      for (let i = 0; i < at.total_questions; i++) {
        const ua = (at.answers || [])[i]; const q = qs[i]; const qn = q?.number; const ca = extractAns(ak[i]);
        let ok;
        if (qn != null && convMap.has(qn)) ok = lenient(ua, convMap.get(qn));
        else {
          const isMcq = q?.options && q.options.length > 0;
          if (isMcq) {
            ok = matchMcqAnswer(String(ua ?? ''), ca, q.options);
            if (!ok && q.acceptedAnswers?.length) ok = q.acceptedAnswers.some((c) => normalize(c) === normalize(String(ua ?? '')));
          } else if (q?.subParts) {
            const parts = String(ua ?? '').split(' / ');
            ok = q.subParts.every((sp, j) => { const sn = normalize(parts[j]?.trim() ?? ''); return [sp.answer, ...(sp.acceptedAnswers ?? [])].some((c) => normalize(c) === sn); });
            if (!ok) { const sn = normalize(String(ua ?? '')); ok = [ca, ...(q.acceptedAnswers ?? [])].some((c) => normalize(c) === sn); }
          } else {
            const sn = normalize(String(ua ?? '')); const cand = [ca, ...(q?.acceptedAnswers ?? [])];
            ok = cand.some((c) => normalize(c) === sn) || cand.some((c) => normalizeSeparators(String(ua ?? '')) === normalizeSeparators(c)) || cand.some((c) => isSubstringMatch(String(ua ?? ''), c));
          }
        }
        if (ok) correct++; else wrongs.push({ number: i + 1, userAnswer: ua ?? '', correctAnswer: ca, question: q?.question });
      }
      const ns = Math.round((correct / at.total_questions) * 100);
      const conv = [...convMap.keys()].filter((qn) => { const q = qs.find((x) => x.number === qn); return q; });
      console.log(`  [${sheet.title.slice(0,22)} ${sheet.id.slice(0,8)}] stu=${at.student_id.slice(0,8)} ${at.score}→${ns} (전환Q ${conv.join(',')})`);
      if (!APPLY) continue;
      await sb.from('naesin_problem_attempts').update({ score: ns, wrong_answers: wrongs }).eq('id', at.id);
      await sb.from('naesin_wrong_answers').delete().eq('student_id', at.student_id).eq('sheet_id', sheet.id);
      if (wrongs.length) await sb.from('naesin_wrong_answers').insert(wrongs.map((wa) => { const q = qs[wa.number - 1]; return { student_id: at.student_id, unit_id: sheet.unit_id, stage, source_type: sheet.mode, question_data: { ...wa, ...(q?.options ? { options: q.options } : {}) }, sheet_id: sheet.id }; }));
    }
  }
  console.log(APPLY ? '\n✓ 재채점 완료' : '\n[dry-run]');
}
await run();
