/**
 * 수동태 Step3 — 39개 객관식 직접 재검증에서 추가 발견된 3건 수정 (시트 933bcd0f, 0시도).
 *   node scripts/fix-sudongtae-step3-recheck.mjs [--apply]
 *
 * 현 Q1 (옛 Q2): 보기 컬럼분할 파손 → options[0]의 5개 트리플릿으로 재구성 + 정답 ①→⑤ (were designed/be excited/invented)
 * 현 Q9 (옛 Q10): 복수정답 "2"→"2, 5" (⑤ "by people"도 생략 가능)
 * 현 Q11(옛 Q12): 정답 보기 ④ "by many parts"→"in many parts"
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SHEET_ID = '933bcd0f-30f2-4972-88b7-3a7509133530';

async function run() {
  const { data, error } = await sb.from('naesin_problem_sheets').select('questions, answer_key').eq('id', SHEET_ID).single();
  if (error) { console.error(error); process.exit(1); }
  writeFileSync(new URL('../scripts/sudongtae-step3-recheck-backup.json', import.meta.url), JSON.stringify(data, null, 2));
  const qs = data.questions, ak = data.answer_key; const warns = [];
  const byNum = (n) => qs.find((q) => q.number === n);

  // 현 Q1: 보기 재구성 + 정답 5
  { const q = byNum(1);
    if (q.options && q.options.length === 4 && /①.*②.*③/s.test(q.options[0])) {
      q.options = q.options[0].split('\n').map((o) => o.replace(/^[①②③④⑤]\s*/, '').trim()).filter(Boolean);
      q.answer = '5'; ak[0] = '5';
      q.explanation = "ⓐ 'were designed'(수동태), ⓑ 'be excited'(조동사 뒤 수동태), ⓒ 'invented'(능동 과거)가 모두 맞는 ⑤가 정답이다.";
      console.log(`  Q1 보기 재구성(${q.options.length}개) + 정답→5`);
    } else warns.push('⚠ Q1: 예상 파손 구조 아님 — 보류');
  }
  // 현 Q9: 복수정답 2 → 2, 5
  { const q = byNum(9);
    if (q.answer === '2' && ak[8] === '2') { q.answer = '2, 5'; ak[8] = '2, 5';
      q.explanation = "② 'by someone', ⑤ 'by people'은 행위자가 불특정·일반이라 생략할 수 있다.";
      console.log('  Q9 정답 "2"→"2, 5"'); } else warns.push(`⚠ Q9: 현재 정답이 "2"가 아님(=${q.answer}) — 보류`);
  }
  // 현 Q11: 보기 ④ by→in
  { const q = byNum(11);
    if (q.options && /by many parts of the world/.test(q.options[3])) {
      q.options[3] = q.options[3].replace('by many parts of the world', 'in many parts of the world');
      console.log('  Q11 보기④ by→in'); } else warns.push('⚠ Q11: 보기④ "by many parts" 미발견 — 보류');
  }

  warns.forEach((w) => console.log('  ', w));
  if (APPLY) {
    const { error: e } = await sb.from('naesin_problem_sheets').update({ questions: qs, answer_key: ak }).eq('id', SHEET_ID);
    if (e) { console.error(e); process.exit(1); } console.log('  ✓ 저장됨');
  } else console.log('  [dry-run] --apply 로 적용');
  console.log('  백업: scripts/sudongtae-step3-recheck-backup.json');
}
await run();
