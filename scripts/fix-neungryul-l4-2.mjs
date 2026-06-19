/**
 * 능률김 4과 예상문제 2회(79613a26) — Q7 삭제.
 * Q7: 보기가 ⓐ~ⓔ 후보 문장 묶음인데 그 ⓐ~ⓔ 목록이 문제에 없고 해설도 내용 미기재
 *   → 복원 불가(원본 PDF 필요) = 삭제 + 번호재정리. 시도 0 → 재채점 불필요.
 *   node scripts/fix-neungryul-l4-2.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function run() {
  const { data: rows } = await sb.from('naesin_problem_sheets').select('id, source_template_id, questions, answer_key').eq('unit_id', 'ef3e4020-836b-4cc3-ae94-50e2ca327fea').eq('category', 'mock_exam');
  const sheet = rows.find((r) => r.id.startsWith('79613a26'));
  if (sheet.source_template_id) { console.log('⚠ 복사본임(source_template_id 있음) — 중단'); return; }
  const idx = sheet.questions.findIndex((x) => x.number === 7);
  const q = sheet.questions[idx];
  if (!q || !/stomachache/.test(q.question) || !/ⓐ, ⓑ/.test((q.options || []).join(''))) { console.log('⚠ Q7 미매칭 — 중단'); return; }
  writeFileSync(new URL('../scripts/neungryul-l4-2-backup.json', import.meta.url), JSON.stringify({ questions: sheet.questions, answer_key: sheet.answer_key }, null, 2));
  const before = sheet.questions.length;
  const kept = sheet.questions.filter((x) => x.number !== 7);
  for (const x of kept) if (x.number > 7) x.number -= 1;
  sheet.answer_key.splice(idx, 1);
  console.log(`Q7 삭제: ${before}→${kept.length}문항, answer_key ${sheet.answer_key.length}, 번호연속=${kept.every((x, i) => x.number === i + 1)}`);
  if (APPLY) { const { error } = await sb.from('naesin_problem_sheets').update({ questions: kept, answer_key: sheet.answer_key }).eq('id', sheet.id); if (error) { console.error(error); process.exit(1); } console.log('✓ 저장됨 (백업: scripts/neungryul-l4-2-backup.json)'); }
  else console.log('[dry-run]');
}
await run();
