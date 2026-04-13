import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 리터럴 backslash + n (2글자). JS에서는 '\\n'으로 표기.
const LITERAL = '\\n';

function walk(value, path, hits) {
  if (value == null) return;
  if (typeof value === 'string') {
    if (value.includes(LITERAL)) {
      hits.push({ path, snippet: value.slice(0, 120) });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, hits));
    return;
  }
  if (typeof value === 'object') {
    for (const k of Object.keys(value)) {
      walk(value[k], path ? `${path}.${k}` : k, hits);
    }
  }
}

function scanQuestions(questions) {
  const hits = [];
  if (!Array.isArray(questions)) return hits;
  for (const q of questions) {
    const localHits = [];
    walk(q, `Q${q?.number ?? '?'}`, localHits);
    hits.push(...localHits);
  }
  return hits;
}

// === 1) naesin_templates ===
console.log('=== naesin_templates 검사 ===');
const { data: templates, error: tplErr } = await sb
  .from('naesin_templates')
  .select('id, title, questions');

if (tplErr) {
  console.error('templates 조회 실패:', tplErr.message);
  process.exit(1);
}

let tplHitCount = 0;
for (const tpl of templates) {
  const hits = scanQuestions(tpl.questions);
  if (hits.length > 0) {
    tplHitCount++;
    console.log(`\n[TEMPLATE] ${tpl.title} (${tpl.id})`);
    for (const h of hits) {
      console.log(`  ${h.path}: ${JSON.stringify(h.snippet)}`);
    }
  }
}
console.log(`\n템플릿 ${templates.length}개 중 ${tplHitCount}개에서 리터럴 \\n 발견`);

// === 2) naesin_problem_sheets ===
console.log('\n=== naesin_problem_sheets 검사 ===');
const { data: sheets, error: sheetsErr } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, source_template_id, questions');

if (sheetsErr) {
  console.error('sheets 조회 실패:', sheetsErr.message);
  process.exit(1);
}

let sheetHitCount = 0;
for (const sheet of sheets) {
  const hits = scanQuestions(sheet.questions);
  if (hits.length > 0) {
    sheetHitCount++;
    console.log(`\n[SHEET] ${sheet.title} (${sheet.id}) src=${sheet.source_template_id ?? 'null'}`);
    for (const h of hits) {
      console.log(`  ${h.path}: ${JSON.stringify(h.snippet)}`);
    }
  }
}
console.log(`\n시트 ${sheets.length}개 중 ${sheetHitCount}개에서 리터럴 \\n 발견`);

console.log('\n=== 요약 ===');
console.log(`템플릿: ${tplHitCount}개, 시트: ${sheetHitCount}개`);
