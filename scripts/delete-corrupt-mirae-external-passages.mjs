/**
 * 미래엔 공통영어2 외부지문 6건 삭제 (2026-09-23).
 * 원인: 추출 소스가 지문이 아니라 "올림포스 문제지"(본문에 (A)/(B)/(C) 선택지·①②③④⑤ 번호가 박혀 있고
 * 그 위에 필기가 겹침) + 추출 모델이 Haiku여서 가려진 글자를 추측 → simile→smile, talking→taking,
 * 원문에 없는 어구 삽입 등 문장이 통째로 훼손됨. 학생이 그대로 외우면 틀린 영어를 외우게 되므로 삭제.
 * 학생 시도·임시저장·영상진도 모두 0건 확인 후 실행. 백업은 scripts/backups/.
 *   node scripts/delete-corrupt-mirae-external-passages.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) { const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, ''); }
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: sheets } = await sb.from('naesin_problem_sheets').select('*').eq('category', 'external_passage').gte('created_at', '2026-09-23');
const ids = sheets.map((s) => s.id);
const [{ data: att }, { data: dr }] = await Promise.all([
  sb.from('naesin_problem_attempts').select('id').in('sheet_id', ids),
  sb.from('naesin_problem_drafts').select('id').in('sheet_id', ids),
]);
console.log(`대상 ${sheets.length}장: ${sheets.map((s) => s.title).join(', ')}`);
console.log(`학생 시도 ${att?.length ?? 0} / 임시저장 ${dr?.length ?? 0}`);
if ((att?.length ?? 0) > 0 || (dr?.length ?? 0) > 0) { console.error('학생 기록이 있어 중단 — 수동 확인 필요'); process.exit(1); }
writeFileSync(new URL('../scripts/backups/mirae-external-passages-corrupt-20260923.json', import.meta.url), JSON.stringify(sheets, null, 1));
if (!APPLY) { console.log('[dry-run] --apply 로 삭제'); process.exit(0); }
const { error } = await sb.from('naesin_problem_sheets').delete().in('id', ids); if (error) throw error;
console.log('✓ 삭제 완료 (백업: scripts/backups/mirae-external-passages-corrupt-20260923.json)');
