import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEMPLATE_TITLE = '5형식 make Step2';

// 1) naesin_templates 수정
const { data: tpl, error: fetchErr } = await sb
  .from('naesin_templates')
  .select('id, title, questions')
  .eq('title', TEMPLATE_TITLE)
  .maybeSingle();

if (fetchErr || !tpl) {
  console.error('템플릿 조회 실패:', fetchErr?.message ?? 'not found');
  process.exit(1);
}

function fixQ25(questions) {
  const q25 = questions.find((q) => q.number === 25);
  if (!q25 || !Array.isArray(q25.options) || !q25.options[2]) return false;
  const before = q25.options[2];
  if (!before.includes('\\n')) return false;
  q25.options[2] = before.replace(/\\n/g, '\n');
  return true;
}

const tplQuestions = tpl.questions;
if (fixQ25(tplQuestions)) {
  const { error } = await sb
    .from('naesin_templates')
    .update({ questions: tplQuestions })
    .eq('id', tpl.id);
  if (error) {
    console.error('템플릿 업데이트 실패:', error.message);
    process.exit(1);
  }
  console.log('템플릿 업데이트 완료 (id:', tpl.id, ')');
} else {
  console.log('템플릿은 이미 정상 or Q25 없음');
}

// 2) 이 템플릿에서 복사된 문제 시트들 수정
const { data: sheets, error: sheetsErr } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions')
  .eq('source_template_id', tpl.id);

if (sheetsErr) {
  console.error('시트 조회 실패:', sheetsErr.message);
  process.exit(1);
}

console.log(`\n연결된 시트 ${sheets.length}개 검사 중...`);

let fixedCount = 0;
for (const sheet of sheets) {
  if (!Array.isArray(sheet.questions)) continue;
  if (fixQ25(sheet.questions)) {
    const { error } = await sb
      .from('naesin_problem_sheets')
      .update({ questions: sheet.questions })
      .eq('id', sheet.id);
    if (error) {
      console.error(`  시트 ${sheet.id} (${sheet.title}) 업데이트 실패:`, error.message);
      continue;
    }
    console.log(`  수정: ${sheet.title} (${sheet.id})`);
    fixedCount++;
  }
}

console.log(`\n시트 ${fixedCount}/${sheets.length}개 수정 완료`);

// 3) title로 매칭되는 시트 (source_template_id 없이 제목만 같은 경우)도 혹시 모르니 체크
const { data: orphanSheets, error: orphanErr } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions, source_template_id')
  .eq('title', TEMPLATE_TITLE)
  .is('source_template_id', null);

if (!orphanErr && orphanSheets && orphanSheets.length > 0) {
  console.log(`\norphan 시트 ${orphanSheets.length}개 추가 검사...`);
  let orphanFixed = 0;
  for (const sheet of orphanSheets) {
    if (!Array.isArray(sheet.questions)) continue;
    if (fixQ25(sheet.questions)) {
      const { error } = await sb
        .from('naesin_problem_sheets')
        .update({ questions: sheet.questions })
        .eq('id', sheet.id);
      if (error) continue;
      console.log(`  수정: ${sheet.title} (${sheet.id})`);
      orphanFixed++;
    }
  }
  console.log(`orphan ${orphanFixed}/${orphanSheets.length}개 수정`);
}

console.log('\n완료.');
