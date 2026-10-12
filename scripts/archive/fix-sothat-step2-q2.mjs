/**
 * so that Step2 Q2 — 복수정답 누락 수정 (내가 직접 풀어 확정: ①⑤ 둘 다 부적절).
 * 보기 개별형(조합형 아님). 템플릿 68d46c5a + 복사 4시트. 시도 시트 관대 재채점.
 *   node scripts/fix-sothat-step2-q2.mjs [--apply]
 *
 * Q2 "I went to a bookstore ___ buy some books. 적절하지 않은 것은?"
 *   ① so that(주어+조동사 필요) ⑤ for the purpose of(동명사 필요, "of buy" 비문) 둘 다 부적절.
 *   → 질문 "모두 고르면(정답 2개)", answer "1"→"1, 5", multi_choice, 해설 보강.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TMPL = '68d46c5a';

// regrade helpers (MCQ + lenient for Q2)
const CIRC = { '①':'1','②':'2','③':'3','④':'4','⑤':'5' };
const unc = (s) => String(s).replace(/[①②③④⑤]+/g, (m) => [...m].map((c) => CIRC[c] ?? c).join(','));
function normMulti(s){const p=String(s).split(',').map(v=>v.trim());if(p.length<=1)return String(s).trim().toLowerCase();if(p.every(x=>/^\d+$/.test(x)))return p.sort((a,b)=>+a-+b).join(', ');return p.map(x=>x.toLowerCase()).sort().join(', ');}
function matchMcq(u0,c0,opt){const u=unc(u0).trim().toLowerCase(),c=unc(c0).trim().toLowerCase();if(u===c)return true;if(c.includes(',')||u.includes(','))if(normMulti(u)===normMulti(c))return true;if(!opt||!opt.length)return false;const i=parseInt(u,10);if(!isNaN(i)&&i>=1&&i<=opt.length&&opt[i-1].trim().toLowerCase()===c)return true;return false;}
const extractAns=(v)=>v==null?'':typeof v==='object'&&'answer' in v?String(v.answer??''):String(v);
const lenient=(ua,set)=>{const u=String(ua??'').split(',').map(x=>x.trim()).filter(x=>/^\d+$/.test(x)).map(Number);return u.length>0&&u.every(x=>set.has(x));};

async function run() {
  const { data: tmpls } = await sb.from('naesin_templates').select('id').eq('template_topic', 'so that');
  const tmplId = tmpls.find((t) => t.id.startsWith(TMPL)).id;
  const { data: copies } = await sb.from('naesin_problem_sheets').select('id').eq('source_template_id', tmplId);
  const targets = [['naesin_templates', tmplId], ...copies.map((c) => ['naesin_problem_sheets', c.id])];
  const backup = {};
  for (const [table, id] of targets) {
    const { data: row } = await sb.from(table).select('questions, answer_key').eq('id', id).single();
    backup[`${table}_${id}`] = JSON.parse(JSON.stringify({ questions: row.questions, answer_key: row.answer_key }));
    const idx = row.questions.findIndex((x) => x.number === 2);
    const q = row.questions[idx];
    if (!q || !/bookstore/.test(q.question)) { console.log(`  ⚠ ${id.slice(0,8)} Q2 미매칭`); continue; }
    q.question = q.question.replace('적절하지 않은 것은?', '적절하지 않은 것을 모두 고르면? (정답 2개)');
    q.answer = '1, 5'; q.type = 'multi_choice'; row.answer_key[idx] = '1, 5';
    q.explanation = '① so that 뒤에는 「주어+조동사+동사」가 와야 하므로 "so that buy"는 불가하다. ⑤ for the purpose of 뒤에는 동명사가 와야 하므로 "for the purpose of buy"도 불가하다(buying이어야 함). 따라서 ①과 ⑤가 부적절하다.';
    console.log(`  [${table.includes('templates')?'TMPL':'SHEET'} ${id.slice(0,8)}] Q2 "1"→"1, 5" + 모두고르면`);
    if (APPLY) await sb.from(table).update({ questions: row.questions, answer_key: row.answer_key }).eq('id', id);
  }
  writeFileSync(new URL('../scripts/sothat-step2-q2-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  if (!APPLY) { console.log('\n[dry-run]'); return; }

  console.log('\n=== 시도 시트 관대 재채점 ===');
  for (const c of copies) {
    const { data: sheet } = await sb.from('naesin_problem_sheets').select('id, unit_id, answer_key, questions, mode, category').eq('id', c.id).single();
    const { data: attempts } = await sb.from('naesin_problem_attempts').select('id, student_id, answers, score, total_questions').eq('sheet_id', c.id).order('created_at');
    if (!attempts?.length) continue;
    const ak = sheet.answer_key, qs = sheet.questions, stage = sheet.category === 'mock_exam' ? 'mockExam' : 'problem';
    const convSet = new Set([1, 5]);
    for (const at of attempts) {
      let correct = 0; const wrongs = [];
      for (let i = 0; i < at.total_questions; i++) {
        const ua = (at.answers || [])[i]; const q = qs[i];
        let ok; if (q?.number === 2) ok = lenient(ua, convSet);
        else { const ca = extractAns(ak[i]); ok = q?.options?.length ? matchMcq(String(ua ?? ''), ca, q.options) : false; if (!ok && q?.acceptedAnswers?.length) ok = q.acceptedAnswers.some((x) => String(x).trim().toLowerCase() === String(ua ?? '').trim().toLowerCase()); }
        if (ok) correct++; else wrongs.push({ number: i + 1, userAnswer: ua ?? '', correctAnswer: extractAns(ak[i]), question: q?.question });
      }
      const ns = Math.round((correct / at.total_questions) * 100);
      console.log(`  [${sheet.id.slice(0,8)}] stu=${at.student_id.slice(0,8)} ${at.score}→${ns}`);
      await sb.from('naesin_problem_attempts').update({ score: ns, wrong_answers: wrongs }).eq('id', c.id === sheet.id ? at.id : at.id);
      await sb.from('naesin_wrong_answers').delete().eq('student_id', at.student_id).eq('sheet_id', sheet.id);
      if (wrongs.length) await sb.from('naesin_wrong_answers').insert(wrongs.map((wa) => { const q = qs[wa.number - 1]; return { student_id: at.student_id, unit_id: sheet.unit_id, stage, source_type: sheet.mode, question_data: { ...wa, ...(q?.options ? { options: q.options } : {}) }, sheet_id: sheet.id }; }));
    }
  }
  console.log('\n✓ 완료 (백업: scripts/sothat-step2-q2-backup.json)');
}
await run();
