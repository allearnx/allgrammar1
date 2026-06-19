/**
 * 복수정답 일괄수정(6975934) 전체 원복.
 * 43건이 사실상 전부 "조합형 보기"(옵션이 "ⓐ, ⓒ"/"①, ④" 쌍) 문항이었고, 그 경우
 * 정답은 단일 번호(맞는 쌍)가 옳다. 스캐너가 오인. 백업에서 questions+answer_key 통째 원복.
 *   node scripts/revert-combo-undercount.mjs [--apply]
 * 이후 7 시도 시트는 원래 키로 재채점(scripts/fix-multi-regrade.mjs 재실행 — 전환맵 비어 원점).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const backup = JSON.parse(readFileSync(new URL('../scripts/multi-undercount-backup.json', import.meta.url), 'utf8'));

async function run() {
  let n = 0;
  for (const [key, orig] of Object.entries(backup)) {
    const table = key.startsWith('naesin_templates_') ? 'naesin_templates' : 'naesin_problem_sheets';
    const id = key.slice(table.length + 1);
    console.log(`  ${table.includes('templates') ? 'TMPL' : 'SHEET'} ${id.slice(0, 8)} 원복 (${orig.questions.length}문항)`);
    if (APPLY) { const { error } = await sb.from(table).update({ questions: orig.questions, answer_key: orig.answer_key }).eq('id', id); if (error) console.error(error); }
    n++;
  }
  console.log(`\n${APPLY ? '✓ 원복 완료' : '[dry-run]'}: ${n}개 아티팩트 (백업 통째 복원)`);
}
await run();
