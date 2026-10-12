/**
 * 천재소 4과 예상문제 검수 수정. 2개 단독 시트(템플릿 없음), 시도 0 → 재채점 불필요.
 *   node scripts/fix-me-lesson4.mjs [--apply]
 *
 * Sheet A(9cb65953): Q3 보기뱅크(ⓐ~ⓓ) 유실 복원 (해설+정답으로 도출)
 * Sheet B(e6d480f3):
 *   Q3 밑줄 <u> 복원(보기별 공통 단어), Q7 보기(ⓐ~ⓔ 표현) 유실 복원(해설에 5개 다 있음),
 *   Q6/18/19/29 "모두 고르면" 복수정답 누락(해설이 2개 명시) → 콤마 복수정답+multi_choice,
 *   Q8 삭제(대화 미포함+Empire State Building 부분 유실 = 복원불가) + 번호재정리
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const A_ID = JSON.parse(readFileSync('/tmp/me4_9cb65953.json', 'utf8')).id;
const B_ID = JSON.parse(readFileSync('/tmp/me4_e6d480f3.json', 'utf8')).id;
const repl = (obj, field, from, to, w, lab) => { const b = obj[field]; obj[field] = b.split(from).join(to); if (b === obj[field]) w.push(`⚠ ${lab}: "${from.slice(0,22)}" 미발견`); };

async function run() {
  const backup = {};
  // ===== Sheet A =====
  { const { data } = await sb.from('naesin_problem_sheets').select('questions, answer_key').eq('id', A_ID).single();
    backup.A = JSON.parse(JSON.stringify(data)); const w = []; const q = (n) => data.questions.find((x) => x.number === n);
    repl(q(3), 'question', '차례대로 연결된 것은?', '차례대로 연결된 것은?\n\n<보기> ⓐ step / ⓑ bend / ⓒ take off / ⓓ wave', w, 'AQ3 보기');
    console.log(`[Sheet A ${A_ID.slice(0,8)}] Q3 보기 복원`); w.forEach((x) => console.log('  ', x));
    if (APPLY) await sb.from('naesin_problem_sheets').update({ questions: data.questions }).eq('id', A_ID);
  }
  // ===== Sheet B =====
  { const { data } = await sb.from('naesin_problem_sheets').select('questions, answer_key').eq('id', B_ID).single();
    backup.B = JSON.parse(JSON.stringify(data)); const w = []; const q = (n) => data.questions.find((x) => x.number === n);
    // Q3 밑줄
    const q3 = q(3);
    const q3u = [
      [['step carefully', '<u>step</u> carefully'], ['first step in', 'first <u>step</u> in']],
      [['draw a circle', 'draw a <u>circle</u>'], ['Please circle the', 'Please <u>circle</u> the']],
      [['a lesson about', 'a <u>lesson</u> about'], ['next lesson starts', 'next <u>lesson</u> starts']],
      [['He waved his', 'He <u>waved</u> his'], ['big waves', 'big <u>waves</u>']],
      [['stood barefoot in', 'stood <u>barefoot</u> in'], ['danced barefoot on', 'danced <u>barefoot</u> on']],
    ];
    q3u.forEach((pairs, i) => { let s = q3.options[i]; for (const [f, t] of pairs) { const b = s; s = s.split(f).join(t); if (b === s) w.push(`⚠ BQ3 opt${i+1}: "${f}" 미발견`); } q3.options[i] = s; });
    // Q7 보기 복원
    repl(q(7), 'question', 'big green statue of a woman.', 'big green statue of a woman.\n\n<보기>\nⓐ Sorry?\nⓑ Is that clear?\nⓒ Are you with me?\nⓓ Can you repeat that, please?\nⓔ Would you mind saying that again?', w, 'BQ7 보기');
    // Q6/18/19/29 복수정답 + multi
    for (const [n, ans] of [[6, '3, 5'], [18, '2, 5'], [19, '3, 4'], [29, '1, 3']]) {
      const x = q(n); const idx = n - 1;
      if (x.answer.includes(',')) { w.push(`⚠ Q${n} 이미 복수`); continue; }
      x.answer = ans; x.type = 'multi_choice'; data.answer_key[idx] = ans;
    }
    // Q8 삭제
    if (data.questions[7].number !== 8) w.push('⚠ B questions[7]≠Q8 — 삭제보류'); else {
      data.questions = data.questions.filter((x) => x.number !== 8);
      for (const x of data.questions) if (x.number > 8) x.number -= 1;
      data.answer_key.splice(7, 1);
    }
    console.log(`[Sheet B ${B_ID.slice(0,8)}] Q3밑줄 Q6/18/19/29복수 Q7보기 Q8삭제(${backup.B.questions.length}→${data.questions.length})`); w.forEach((x) => console.log('  ', x));
    console.log(`   questions=${data.questions.length} ak=${data.answer_key.length} 번호연속=${data.questions.every((x,i)=>x.number===i+1)}`);
    if (APPLY) await sb.from('naesin_problem_sheets').update({ questions: data.questions, answer_key: data.answer_key }).eq('id', B_ID);
  }
  writeFileSync(new URL('../scripts/me-lesson4-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log(APPLY ? '\n✓ 적용 완료 (백업: scripts/me-lesson4-backup.json)' : '\n[dry-run] --apply 로 적용');
}
await run();
