/**
 * 동아윤 4과 예상문제 1회(3f5bec17) — 복수정답 누락 6건 (한 문항씩 직접 풀어 확정).
 * 전부 "모두 고르면" + 개별 보기 + 해설이 2정답 명시. 조합형 아님. 0시도 → 재채점 불필요.
 *   node scripts/fix-dongah-l4-1.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SHEET = '3f5bec17';
const FIXES = [[5, '3, 5'], [6, '2, 5'], [9, '2, 5'], [17, '2, 4'], [18, '3, 4'], [20, '3, 5']];

async function run() {
  const { data: tb } = await sb.from('naesin_textbooks').select('id').ilike('display_name', '%중2 동아윤%').single();
  const { data: units } = await sb.from('naesin_units').select('id').eq('textbook_id', tb.id).eq('unit_number', 4);
  const { data: shs } = await sb.from('naesin_problem_sheets').select('id, source_template_id, questions, answer_key').eq('unit_id', units[0].id).eq('category', 'mock_exam');
  const sheet = shs.find((s) => s.id.startsWith(SHEET));
  if (sheet.source_template_id) { console.log('⚠ 복사본(source_template_id 있음) — 동기화 필요'); }
  writeFileSync(new URL('../scripts/dongah-l4-1-backup.json', import.meta.url), JSON.stringify({ questions: sheet.questions, answer_key: sheet.answer_key }, null, 2));
  for (const [n, a] of FIXES) {
    const idx = sheet.questions.findIndex((x) => x.number === n);
    const q = sheet.questions[idx];
    if (!q) { console.log(`  ⚠ Q${n} 없음`); continue; }
    // 조합형 보기면 중단(안전)
    const isCombo = q.options.filter((o) => /^[\s①-⑩ⓐ-ⓩ㉠-㉤ㄱ-ㅎ,，·]+$/.test(o) && (o.match(/[①-⑩ⓐ-ⓩ㉠-㉤ㄱ-ㅎ]/g) || []).length >= 2).length >= Math.ceil(q.options.length / 2);
    if (isCombo) { console.log(`  ⚠ Q${n} 조합형 감지 — 건너뜀(안전)`); continue; }
    console.log(`  Q${n}: "${q.answer}"→"${a}"`);
    q.answer = a; q.type = 'multi_choice'; sheet.answer_key[idx] = a;
  }
  if (APPLY) { const { error } = await sb.from('naesin_problem_sheets').update({ questions: sheet.questions, answer_key: sheet.answer_key }).eq('id', sheet.id); if (error) { console.error(error); process.exit(1); } console.log('✓ 저장됨 (백업: scripts/dongah-l4-1-backup.json) — 0시도 재채점 불필요'); }
  else console.log('[dry-run]');
}
await run();
