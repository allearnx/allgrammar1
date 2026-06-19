/**
 * 수동태 Step3 템플릿 신규 생성.
 * 템플릿이 삭제돼 고아 시트(933bcd0f, 천재 복사본)만 남은 상태 → 수정 완료된 53문항으로
 * naesin_templates에 정식 템플릿 생성 + 고아 시트의 dangling source_template_id를 새 템플릿으로 연결.
 *   node scripts/create-sudongtae-step3-template.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const SHEET_ID = '933bcd0f-30f2-4972-88b7-3a7509133530';
const CREATED_BY = '409d1540-efe2-4e72-8296-33cd53a1fd1e'; // 기존 수동태 템플릿과 동일 소유자(boss)

async function run() {
  // 고아 시트의 수정 완료된 콘텐츠
  const { data: sheet, error } = await sb.from('naesin_problem_sheets').select('questions, answer_key, source_template_id').eq('id', SHEET_ID).single();
  if (error) { console.error(error); process.exit(1); }
  if (sheet.questions.length !== sheet.answer_key.length) { console.error('길이 불일치'); process.exit(1); }

  const newId = randomUUID();
  const tmpl = {
    id: newId,
    title: '수동태 Step3',
    template_topic: '수동태',
    category: 'problem',
    mode: 'interactive',
    created_by: CREATED_BY,
    questions: sheet.questions,
    answer_key: sheet.answer_key,
  };
  console.log(`새 템플릿 id=${newId}`);
  console.log(`  title=수동태 Step3 | topic=수동태 | category=problem | mode=interactive`);
  console.log(`  문항=${sheet.questions.length} | answer_key=${sheet.answer_key.length}`);
  console.log(`고아 시트 source_template_id: ${sheet.source_template_id}(dangling) → ${newId}`);

  if (!APPLY) { console.log('\n[dry-run] --apply 로 실제 생성'); return; }

  // 1) 템플릿 생성
  const { error: insErr } = await sb.from('naesin_templates').insert(tmpl);
  if (insErr) { console.error('템플릿 생성 실패:', insErr); process.exit(1); }
  console.log('✓ 템플릿 생성됨');

  // 2) 고아 시트를 새 템플릿의 복사본으로 연결 + template_topic 채움
  const { error: upErr } = await sb.from('naesin_problem_sheets').update({ source_template_id: newId, template_topic: '수동태' }).eq('id', SHEET_ID);
  if (upErr) { console.error('시트 연결 실패:', upErr); process.exit(1); }
  console.log('✓ 고아 시트 source_template_id 연결됨');

  // 3) 검증
  const { data: chk } = await sb.from('naesin_templates').select('id, title, category, mode').eq('id', newId).single();
  const { data: sChk } = await sb.from('naesin_problem_sheets').select('source_template_id').eq('id', SHEET_ID).single();
  console.log('검증:', JSON.stringify(chk), '| 시트 src=', sChk.source_template_id);
}
await run();
