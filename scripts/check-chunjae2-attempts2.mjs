import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = 'dc3155de-270a-48eb-b667-1fe4186d0f15';
const unit4 = 'a3d94bca-25a5-4f95-a91c-496f463cdc89';

// Get sheets
const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title')
  .in('unit_id', [unit3, unit4]);

console.log(`시트 ${sheets.length}개`);

// Check multiple possible attempt tables
for (const table of ['naesin_problem_attempts', 'naesin_attempts', 'problem_attempts', 'naesin_student_answers']) {
  const { data, error } = await sb
    .from(table)
    .select('*', { count: 'exact', head: true })
    .limit(0);

  if (!error) {
    console.log(`✅ ${table} 테이블 존재`);
  }
}

// Try naesin_problem_attempts with different column names
const sheetIds = sheets.map(s => s.id);
console.log('\n시트 IDs:', sheetIds.slice(0, 3), '...');

// Check if there are ANY attempts at all
const { data: allAttempts, count, error } = await sb
  .from('naesin_problem_attempts')
  .select('*', { count: 'exact' })
  .limit(5);

console.log(`\nnaesin_problem_attempts 전체: ${count}건, error: ${error?.message || 'none'}`);
if (allAttempts && allAttempts.length > 0) {
  console.log('샘플 컬럼:', Object.keys(allAttempts[0]));

  // Check with correct column name
  const sheetCol = Object.keys(allAttempts[0]).find(k => k.includes('sheet'));
  const unitCol = Object.keys(allAttempts[0]).find(k => k.includes('unit'));
  console.log(`sheet 컬럼: ${sheetCol}, unit 컬럼: ${unitCol}`);

  // Try to find attempts for our units using whatever column exists
  if (sheetCol) {
    const { data: unitAttempts, count: uc } = await sb
      .from('naesin_problem_attempts')
      .select('*', { count: 'exact' })
      .in(sheetCol, sheetIds)
      .limit(5);
    console.log(`\n우리 시트 시도: ${uc}건`);
  }

  if (unitCol) {
    const { data: unitAttempts2, count: uc2 } = await sb
      .from('naesin_problem_attempts')
      .select('*', { count: 'exact' })
      .in(unitCol, [unit3, unit4])
      .limit(5);
    console.log(`우리 유닛 시도: ${uc2}건`);
  }
}

// Also check naesin_student_answers
const { data: sa, error: saErr } = await sb
  .from('naesin_student_answers')
  .select('*', { count: 'exact' })
  .limit(3);

if (!saErr && sa) {
  console.log(`\nnaesin_student_answers: 컬럼:`, Object.keys(sa[0] || {}));
}
