/**
 * 주격관계대명사 Step1 Q44 — 단어세트로 만들 수 없는 정답 교정 (직접 검증).
 * 세트 (... which, fly, is, an eagle)에 be동사 1개뿐 → "which flies"가 정답.
 * 진행형 변형은 acceptedAnswers로 유지(관대 — 누구도 불이익 없음).
 *   node scripts/fix-subjrel-step1-q44.mjs [--apply]
 * 템플릿 398911bb + 복사 시트. 시도 Q44 답 확인 후 필요시 서술형 재채점.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TMPL = '398911bb';
const NEW_ANS = 'The bird which flies in the sky is an eagle.';
const NEW_ACC = ['The bird that flies in the sky is an eagle.', 'The bird which is flying in the sky is an eagle.', 'The bird that is flying in the sky is an eagle.'];
// 서술형 정규화(normalize-answer 미러)
function normalize(s){return String(s).replace(/[\r\n\t]/g,' ').replace(/[‘’`´]/g,"'").replace(/[“”]/g,'"').replace(/[–—−]/g,'-').trim().toLowerCase().replace(/\.+\s*$/,'').replace(/\((\d+)\)\s*/g,'($1) ').replace(/\s*\/\s*/g,' / ').replace(/\s+/g,' ').trim();}

async function run() {
  const { data: tr } = await sb.from('naesin_templates').select('id').eq('template_topic', '주격관계대명사');
  const tmplId = tr.find((r) => r.id.startsWith(TMPL)).id;
  const { data: copies } = await sb.from('naesin_problem_sheets').select('id').eq('source_template_id', tmplId);
  const targets = [['naesin_templates', tmplId], ...copies.map((c) => ['naesin_problem_sheets', c.id])];
  const backup = {};
  for (const [table, id] of targets) {
    const { data: row } = await sb.from(table).select('questions').eq('id', id).single();
    backup[`${table}_${id}`] = JSON.parse(JSON.stringify(row.questions));
    const q = row.questions.find((x) => x.number === 44);
    if (!q || !/an eagle/.test(q.question)) { console.log(`  ⚠ ${id.slice(0,8)} Q44 미매칭`); continue; }
    q.answer = NEW_ANS; q.acceptedAnswers = NEW_ACC;
    console.log(`  [${table.includes('templates')?'TMPL':'SHEET'} ${id.slice(0,8)}] Q44 정답→"which flies" + accepted 3종`);
    if (APPLY) await sb.from(table).update({ questions: row.questions }).eq('id', id);
  }
  writeFileSync(new URL('../scripts/subjrel-step1-q44-backup.json', import.meta.url), JSON.stringify(backup, null, 2));

  // 시도 Q44 답 점검 (Q44가 wrong→correct로 뒤집히는 학생 있나)
  console.log('\n=== 시도 Q44 답 점검 ===');
  const allCand = [NEW_ANS, ...NEW_ACC].map(normalize);
  for (const c of copies) {
    const { data: sheet } = await sb.from('naesin_problem_sheets').select('questions').eq('id', c.id).single();
    const q44idx = sheet.questions.findIndex((x) => x.number === 44);
    const { data: atts } = await sb.from('naesin_problem_attempts').select('id, student_id, answers, score, total_questions, wrong_answers').eq('sheet_id', c.id);
    for (const at of (atts || [])) {
      const ua = (at.answers || [])[q44idx];
      if (ua == null || String(ua).trim() === '') continue;
      const nowOk = allCand.some((cc) => cc === normalize(ua));
      const wasWrong = (at.wrong_answers || []).some((w) => w.number === 44);
      console.log(`  [${c.id.slice(0,8)}] stu=${at.student_id.slice(0,8)} Q44답="${ua}" | 새정답인정=${nowOk} 기존오답기록=${wasWrong}${nowOk && wasWrong ? ' → ⬆ 재채점필요' : ''}`);
    }
  }
  console.log(APPLY ? '\n✓ 적용 (백업: scripts/subjrel-step1-q44-backup.json)' : '\n[dry-run]');
}
await run();
