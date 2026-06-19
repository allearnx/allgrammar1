/**
 * 중2 천재소 Lesson3 예상문제 검수 수정. 단일 시트(템플릿 없음), 시도 0 → 재채점 불필요.
 *   node scripts/fix-me-lesson3.mjs [--apply]
 *
 * Step1(28bef186): Q1 'finding' 밑줄, Q5 보기별 글로싱 단어 밑줄 (정답키 정확)
 * Step2(ec2e68cf): Q3 보기별 단어 밑줄, Q9 "2"→"2, 3"+multi_choice(둘 다 오류),
 *                  Q8 삭제(ⓐ~ⓕ 보기 통째 유실=복원불가) + 번호재정리
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const STEP1 = '28bef186', STEP2 = 'ec2e68cf';

async function getSheet(prefix) {
  const { data } = await sb.from('naesin_problem_sheets').select('id, questions, answer_key').eq('unit_id', 'dc3155de-270a-48eb-b667-1fe4186d0f15').eq('category', 'mock_exam');
  return data.find((s) => s.id.startsWith(prefix));
}
const rep = (obj, field, from, to, warns, lab) => { const b = obj[field]; obj[field] = b.split(from).join(to); if (b === obj[field]) warns.push(`⚠ ${lab}: "${from.slice(0,24)}" 미발견`); };

async function run() {
  const backup = {};
  // ===== STEP1 =====
  { const sh = await getSheet(STEP1); backup.step1 = JSON.parse(JSON.stringify(sh)); const w = []; const q = (n) => sh.questions.find((x) => x.number === n);
    rep(q(1), 'question', 'a surprising finding', 'a surprising <u>finding</u>', w, 'S1Q1');
    const q5 = q(5);
    [['very sharp.', 'very <u>sharp</u>.'], ['kid spilled milk', 'kid <u>spilled</u> milk'], ['I accidentally found', 'I <u>accidentally</u> found'], ['can lead to health', 'can <u>lead to</u> health'], ['He experimented many', 'He <u>experimented</u> many']]
      .forEach(([f, t], i) => { const b = q5.options[i]; q5.options[i] = b.split(f).join(t); if (b === q5.options[i]) w.push(`⚠ S1Q5 opt${i+1}: "${f}" 미발견`); });
    console.log(`[Step1 ${sh.id.slice(0,8)}] Q1 finding 밑줄 + Q5 보기5개 밑줄`); w.forEach((x) => console.log('  ', x));
    if (APPLY) { const { error } = await sb.from('naesin_problem_sheets').update({ questions: sh.questions }).eq('id', sh.id); if (error) { console.error(error); process.exit(1); } console.log('   ✓ 저장'); }
  }
  // ===== STEP2 =====
  { const sh = await getSheet(STEP2); backup.step2 = JSON.parse(JSON.stringify(sh)); const w = []; const q = (n) => sh.questions.find((x) => x.number === n);
    // Q3 보기별 단어 밑줄
    const q3 = q(3);
    const q3map = [
      [['idea hit me', 'idea <u>hit</u> me'], ['She hit the table', 'She <u>hit</u> the table']],
      [['I found my', 'I <u>found</u> my'], ['will found a', 'will <u>found</u> a']],
      [['a liquid,', 'a <u>liquid</u>,'], ['green liquid.', 'green <u>liquid</u>.']],
      [['made of glass.', 'made of <u>glass</u>.'], ['wears glasses when', 'wears <u>glasses</u> when']],
      [['a secret?', 'a <u>secret</u>?'], ['the secret of', 'the <u>secret</u> of']],
    ];
    q3map.forEach((pairs, i) => { let s = q3.options[i]; for (const [f, t] of pairs) { const b = s; s = s.split(f).join(t); if (b === s) w.push(`⚠ S2Q3 opt${i+1}: "${f}" 미발견`); } q3.options[i] = s; });
    // Q9 정답+멀티
    { const x = q(9); x.answer = '2, 3'; x.type = 'multi_choice'; sh.answer_key[8] = '2, 3'; }
    // Q8 삭제 + 번호재정리 + answer_key[7] 제거
    if (sh.questions[7].number !== 8) w.push('⚠ Step2 questions[7]≠Q8 — 삭제보류'); else {
      sh.questions = sh.questions.filter((x) => x.number !== 8);
      for (const x of sh.questions) if (x.number > 8) x.number -= 1;
      sh.answer_key.splice(7, 1);
    }
    console.log(`[Step2 ${sh.id.slice(0,8)}] Q3 밑줄 + Q9 "2"→"2,3"(multi) + Q8 삭제(${backup.step2.questions.length}→${sh.questions.length})`); w.forEach((x) => console.log('  ', x));
    console.log(`   questions=${sh.questions.length}, answer_key=${sh.answer_key.length}, 번호연속=${sh.questions.every((x,i)=>x.number===i+1)}`);
    if (APPLY) { const { error } = await sb.from('naesin_problem_sheets').update({ questions: sh.questions, answer_key: sh.answer_key }).eq('id', sh.id); if (error) { console.error(error); process.exit(1); } console.log('   ✓ 저장'); }
  }
  writeFileSync(new URL('../scripts/me-lesson3-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log(APPLY ? '\n✓ 적용 완료 (백업: scripts/me-lesson3-backup.json)' : '\n[dry-run] --apply 로 적용');
}
await run();
