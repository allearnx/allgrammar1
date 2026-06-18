/**
 * 접속사 although Step1 — "밑줄 친 부분" 문항에 유실된 <u> 밑줄 복원.
 * 대상: 템플릿 9dd66098 + 복사 시트 ca11e985.
 * MCQ(정답=번호)라 채점/정답키 영향 없음 → 재채점 불필요.
 *
 *   node scripts/fix-although-step1-underline.mjs           # dry-run
 *   node scripts/fix-although-step1-underline.mjs --apply
 *
 * Q24: 지문 밑줄이 별표 *...* 로 남음 → <u>...</u> 변환
 * Q25: 보기별 접속사 'Though'에 밑줄 (밑줄 친 부분의 쓰임이 자연스러운 것)
 * Q26: 보기별 접속사 'Although/although'에 밑줄 (쓰임이 어색한 것)
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

function applyEdits(questions, warns) {
  const log = [];
  const byNum = (n) => questions.find((q) => q.number === n);

  // Q24: 별표 → <u>
  { const q = byNum(24); const before = q.question;
    q.question = q.question.replace(/\*([^*]+)\*/g, '<u>$1</u>');
    if (before === q.question) warns.push('Q24: 별표 미발견'); else log.push('Q24 *...* → <u>...</u>'); }

  // Q25: 보기 앞 'Though' 밑줄
  { const q = byNum(25); let n = 0;
    q.options = q.options.map((o) => { const r = o.replace(/^Though\b/, '<u>Though</u>'); if (r !== o) n++; return r; });
    if (n !== q.options.length) warns.push(`Q25: ${q.options.length}개 중 ${n}개만 밑줄`); else log.push(`Q25 보기 ${n}개 Though 밑줄`); }

  // Q26: 보기 'Although/although' 밑줄 (각 보기 첫 1개)
  { const q = byNum(26); let n = 0;
    q.options = q.options.map((o) => { const r = o.replace(/\b([Aa]lthough)\b/, '<u>$1</u>'); if (r !== o) n++; return r; });
    if (n !== q.options.length) warns.push(`Q26: ${q.options.length}개 중 ${n}개만 밑줄`); else log.push(`Q26 보기 ${n}개 although 밑줄`); }

  return log;
}

async function run() {
  const backup = {};
  for (const [label, id, table] of [['template', TEMPLATE_ID, 'naesin_templates'], ['sheet', SHEET_ID, 'naesin_problem_sheets']]) {
    const { data, error } = await sb.from(table).select('questions').eq('id', id).single();
    if (error) { console.error(label, error); process.exit(1); }
    backup[label] = JSON.parse(JSON.stringify(data));
    const warns = [];
    const log = applyEdits(data.questions, warns);
    console.log(`\n[${label} ${id}]`);
    log.forEach((l) => console.log('   -', l));
    warns.forEach((w) => console.log('   ⚠', w));
    // 미리보기
    const q25 = data.questions.find((q) => q.number === 25);
    console.log('   Q25 보기[0]:', q25.options[0]);
    const q26 = data.questions.find((q) => q.number === 26);
    console.log('   Q26 보기[1]:', q26.options[1]);
    if (APPLY) {
      const { error: upErr } = await sb.from(table).update({ questions: data.questions }).eq('id', id);
      if (upErr) { console.error('update 실패', label, upErr); process.exit(1); }
      console.log('   ✓ 저장됨');
    }
  }
  writeFileSync(new URL('../scripts/although-step1-underline-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log('\n백업: scripts/although-step1-underline-backup.json');
  if (!APPLY) console.log('[dry-run] --apply 로 실제 적용');
}
await run();
