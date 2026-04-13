import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 문자열 값에서 리터럴 '\n' (2글자) → 실제 개행 문자로 치환.
// 주의: JSONB에 저장된 실제 개행은 JS 문자열에서 '\n' (1글자)로 표현되므로 영향 없음.
// 리터럴 backslash-n은 JS 문자열에서 '\\n' (2글자 = '\' + 'n')로 표현됨.
function fixString(s) {
  if (typeof s !== 'string') return s;
  if (!s.includes('\\n')) return s;
  return s.replace(/\\n/g, '\n');
}

function fixValue(value) {
  if (value == null) return { value, changed: false };
  if (typeof value === 'string') {
    const fixed = fixString(value);
    return { value: fixed, changed: fixed !== value };
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((v) => {
      const r = fixValue(v);
      if (r.changed) changed = true;
      return r.value;
    });
    return { value: next, changed };
  }
  if (typeof value === 'object') {
    let changed = false;
    const next = {};
    for (const k of Object.keys(value)) {
      const r = fixValue(value[k]);
      if (r.changed) changed = true;
      next[k] = r.value;
    }
    return { value: next, changed };
  }
  return { value, changed: false };
}

async function processTable(table, selectCols) {
  console.log(`\n=== ${table} ===`);
  const { data: rows, error } = await sb.from(table).select(selectCols);
  if (error) {
    console.error(`${table} 조회 실패:`, error.message);
    return { total: 0, fixed: 0 };
  }
  let fixed = 0;
  for (const row of rows) {
    const result = fixValue(row.questions);
    if (!result.changed) continue;
    const { error: upErr } = await sb
      .from(table)
      .update({ questions: result.value })
      .eq('id', row.id);
    if (upErr) {
      console.error(`  ${row.title} (${row.id}) 업데이트 실패:`, upErr.message);
      continue;
    }
    console.log(`  수정: ${row.title} (${row.id})`);
    fixed++;
  }
  console.log(`${table}: ${fixed}/${rows.length} 수정`);
  return { total: rows.length, fixed };
}

const tplRes = await processTable('naesin_templates', 'id, title, questions');
const sheetRes = await processTable('naesin_problem_sheets', 'id, title, questions');

console.log('\n=== 완료 ===');
console.log(`템플릿: ${tplRes.fixed}/${tplRes.total}`);
console.log(`시트: ${sheetRes.fixed}/${sheetRes.total}`);
