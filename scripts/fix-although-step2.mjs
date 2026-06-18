/**
 * 접속사 although Step2 — 정답/한글/해설/추출깨짐 수정 + 복원불가 문항 삭제.
 * 대상: 템플릿 093734a1 + 복사 시트 5d7b85f4 (questions 의미 동일, 속성순서만 다름).
 * 시트 학생 시도 0건 → 재채점 불필요.
 *
 *   node scripts/fix-although-step2.mjs           # dry-run
 *   node scripts/fix-although-step2.mjs --apply   # 실제 적용
 *
 * 삭제: Q9 (대화완성, 추출 깨져 원본 없이 복원 불가 + Q8과 중복) → 삭제 후 번호 재정리 + answer_key[8] 제거
 * 수정: Q1·Q3·Q6·Q40 해설, Q2 오타, Q10·Q11·Q42 깨진 빈칸, Q12 정답(tired)+지시문,
 *       Q38·Q47 한글↔정답 모순, Q39 보기(sounds) 반영, Q45 틀린 허용답 제거, Q51 보기오타+한글오타,
 *       Q12·13·14 "접속사"→"말" 지시문.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TEMPLATE_ID = '093734a1-f9dd-45d9-9f27-366a277df3e2';
const SHEET_ID = '5d7b85f4-c793-4c5c-8d41-a088f42f5635';

const EXPL = {
  1: "'그가 안 된다고 하면, 나도 파티에 가지 않겠다'는 조건의 의미이므로 'if'가 적절합니다.",
  3: "'자주 길을 잃는' 것은 '방향 감각이 정말 나쁘기 때문'이라는 인과관계이므로 'because'가 적절합니다.",
  6: "'날씨가 좋으면 Sam과 소풍을 가겠다'는 조건의 의미이므로 'if'가 적절합니다.",
  40: "'영어 시험에서 A를 받았다'는 결과는 '열심히 공부했다'는 원인과 인과관계이므로 'since(~때문에)'가 적절합니다. (although는 대조라 부적합)",
};

// 한 question 객체에 정규식/문자열 replace를 적용하고 적용 여부를 검증
function rep(q, field, from, to, warns, label) {
  const before = q[field];
  q[field] = before.split(from).join(to);
  if (before === q[field]) warns.push(`⚠ ${label}: "${from}" 미발견`);
}

function applyEdits(questions, answerKey, warns) {
  const log = [];
  const byNum = (n) => questions.find((q) => q.number === n);

  // 해설 교정
  for (const n of [1, 3, 6, 40]) { byNum(n).explanation = EXPL[n]; log.push(`Q${n} 해설 교정`); }
  // Q2 오타
  rep(byNum(2), 'question', 'to solved it', 'to solve it', warns, 'Q2'); log.push('Q2 오타 solved→solve');
  // Q10 깨진 스템 + 정답
  { const q = byNum(10); q.question = "모두가 잘 했지만 우리는 그 경기에서 졌다. (everyone, play)\n→ ________, we lost the game."; q.answer = "Although everyone played well"; answerKey[9] = q.answer; log.push('Q10 스템 재구성 + 정답 everyone'); }
  // Q11 앞 Although 빈칸 추가
  rep(byNum(11), 'question', '→ summer is a fun season', '→ ________ summer is a fun season', warns, 'Q11'); log.push('Q11 앞 빈칸 추가');
  // Q12 정답 tired + 지시문
  { const q = byNum(12); q.answer = 'tired, study'; answerKey[11] = q.answer; log.push('Q12 정답 sick→tired'); }
  // Q12·13·14 지시문 "접속사"→"말"
  for (const n of [12, 13, 14]) rep(byNum(n), 'question', '적절한 접속사를 <보기>', '적절한 말을 <보기>', warns, `Q${n} 지시문`);
  log.push('Q12·13·14 지시문 접속사→말');
  // Q38 한글 모순
  rep(byNum(38), 'question', '좋지 않지만, 그는 그 과일을 좋아한다', '좋지만, 그는 그 과일을 좋아하지 않는다', warns, 'Q38'); log.push('Q38 한글 모순 수정');
  // Q39 보기 sounds 반영
  { const q = byNum(39); q.answer = 'Although classical music sounds beautiful, it is more appropriate for an art museum'; answerKey[38] = q.answer; log.push('Q39 정답 sounds 반영'); }
  // Q42 깨진 빈칸 + 대문자
  rep(byNum(42), 'question', '___________ ____________ There were too many people in the concert hall, the concert', '____________ there were too many people in the concert hall, the concert', warns, 'Q42'); log.push('Q42 빈칸 정리');
  // Q45 틀린 허용답 제거
  { const q = byNum(45); q.answer = 'Though it rained a lot, I went for a walk.'; answerKey[44] = q.answer; log.push('Q45 틀린 허용답 제거'); }
  // Q47 한글 모순
  rep(byNum(47), 'question', '배가 고팠지만', '배가 고프지 않았지만', warns, 'Q47'); log.push('Q47 한글 모순 수정');
  // Q51 보기오타 + 한글오타
  rep(byNum(51), 'question', '우리의 심게', '우리의 마음에', warns, 'Q51 한글'); rep(byNum(51), 'question', 'through', 'though', warns, 'Q51 보기'); log.push('Q51 through→though, 심게→마음에');

  // ── Q9 삭제 + 번호 재정리 + answer_key[8] 제거 ──
  const before = questions.length;
  const kept = questions.filter((q) => q.number !== 9);
  for (const q of kept) if (q.number > 9) q.number -= 1;
  answerKey.splice(8, 1);
  log.push(`Q9 삭제 (${before}→${kept.length}문항), answer_key[8] 제거 (len ${answerKey.length})`);
  return { questions: kept, log };
}

async function run() {
  const backup = {};
  for (const [label, id, table] of [['template', TEMPLATE_ID, 'naesin_templates'], ['sheet', SHEET_ID, 'naesin_problem_sheets']]) {
    const { data, error } = await sb.from(table).select('questions, answer_key').eq('id', id).single();
    if (error) { console.error(label, error); process.exit(1); }
    backup[label] = JSON.parse(JSON.stringify(data));
    const warns = [];
    const { questions: newQ, log } = applyEdits(data.questions, data.answer_key, warns);
    console.log(`\n[${label} ${id}]`);
    log.forEach((l) => console.log('   -', l));
    if (warns.length) { console.log('   경고:'); warns.forEach((w) => console.log('     ', w)); }
    console.log(`   결과: questions=${newQ.length}, answer_key=${data.answer_key.length}`);
    if (APPLY) {
      const { error: upErr } = await sb.from(table).update({ questions: newQ, answer_key: data.answer_key }).eq('id', id);
      if (upErr) { console.error('update 실패', label, upErr); process.exit(1); }
      console.log('   ✓ 저장됨');
    }
  }
  writeFileSync(new URL('../scripts/although-step2-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log('\n백업: scripts/although-step2-backup.json');
  if (!APPLY) console.log('[dry-run] --apply 로 실제 적용');
}
await run();
