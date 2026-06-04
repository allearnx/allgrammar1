import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = '292901be-3bc8-4d27-9456-35ab96718d33';
const unit4 = 'ef3e4020-836b-4cc3-ae94-50e2ca327fea';

// 1. Find source_template_id for the 3 sheets we fixed
const { data: fixedSheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, source_template_id')
  .in('unit_id', [unit3, unit4])
  .or('title.ilike.%to부정사%Step1%,title.ilike.%so that Step 1%,title.ilike.%수동태 Step3%');

console.log('=== 수정된 시트의 템플릿 추적 ===');
for (const s of fixedSheets) {
  console.log(`  ${s.title}: template=${s.source_template_id || '없음'}`);
}

// 2. For each sheet with a source_template_id, update the template too
const fixes = {
  'to부정사': [
    { num: 63, field: 'answer', fn: (old) => old.replace(/,\s*$/, '.') },
  ],
  'so that Step 1': [
    { num: 48, newAnswer: 'I made vocabulary cards so that I could remember them.' },
  ],
  '수동태 Step3': [
    { num: 31, newAnswer: '1' },
    { num: 32, newAnswer: '2' },
    { num: 35, newAnswer: '3' },
    { num: 36, newAnswer: '1' },
    { num: 40, newAnswer: '2, 3' },
    { num: 41, newAnswer: '2' },
  ],
};

for (const sheet of fixedSheets) {
  if (!sheet.source_template_id) {
    console.log(`\n⚠️ ${sheet.title}: 템플릿 없음 (직접 생성된 시트)`);
    continue;
  }

  // Find which fixes apply
  const key = Object.keys(fixes).find(k => sheet.title.includes(k));
  if (!key) continue;

  const { data: tmpl } = await sb
    .from('naesin_templates')
    .select('id, title, questions, answer_key')
    .eq('id', sheet.source_template_id)
    .single();

  if (!tmpl) {
    console.log(`\n⚠️ ${sheet.title}: 템플릿 ID ${sheet.source_template_id} 찾을 수 없음`);
    continue;
  }

  console.log(`\n=== 템플릿 수정: ${tmpl.title} ===`);
  const qs = [...tmpl.questions];
  const ak = [...(tmpl.answer_key || [])];

  for (const fix of fixes[key]) {
    const idx = qs.findIndex(q => q.number === fix.num);
    if (idx === -1) { console.log(`  ⚠️ Q${fix.num} not found in template`); continue; }

    const old = qs[idx].answer;
    const newAnswer = fix.newAnswer || fix.fn(old);
    qs[idx] = { ...qs[idx], answer: newAnswer };
    ak[idx] = newAnswer;
    console.log(`  Q${fix.num}: "${old}" → "${newAnswer}"`);
  }

  const { error } = await sb
    .from('naesin_templates')
    .update({ questions: qs, answer_key: ak })
    .eq('id', tmpl.id);

  console.log(error ? `  ❌ ${error.message}` : `  ✅ 템플릿 저장 완료`);

  // 3. Also check if this template was copied to OTHER sheets (other textbooks)
  const { data: copies } = await sb
    .from('naesin_problem_sheets')
    .select('id, title, unit_id')
    .eq('source_template_id', tmpl.id)
    .not('unit_id', 'in', `(${unit3},${unit4})`);

  if (copies && copies.length > 0) {
    console.log(`  ⚠️ 이 템플릿이 다른 ${copies.length}개 유닛에도 복사됨 — 같이 수정`);
    for (const copy of copies) {
      const { data: copySheet } = await sb
        .from('naesin_problem_sheets')
        .select('id, title, questions, answer_key')
        .eq('id', copy.id)
        .single();

      const cqs = [...copySheet.questions];
      const cak = [...(copySheet.answer_key || [])];

      for (const fix of fixes[key]) {
        const cidx = cqs.findIndex(q => q.number === fix.num);
        if (cidx === -1) continue;
        const newAnswer = fix.newAnswer || fix.fn(cqs[cidx].answer);
        cqs[cidx] = { ...cqs[cidx], answer: newAnswer };
        cak[cidx] = newAnswer;
      }

      const { error: ce } = await sb
        .from('naesin_problem_sheets')
        .update({ questions: cqs, answer_key: cak })
        .eq('id', copy.id);

      console.log(ce ? `    ❌ ${copy.title}: ${ce.message}` : `    ✅ ${copy.title} 수정 완료`);
    }
  }
}

// 4. Find matching seed files
console.log('\n=== 시드 파일 확인 ===');
import { readdirSync } from 'fs';
const seeds = readdirSync('supabase/seeds').filter(f => f.endsWith('.sql'));
const relevant = seeds.filter(f =>
  f.includes('passive') || f.includes('수동태') ||
  f.includes('so_that') || f.includes('sothat') ||
  f.includes('infinitive') || f.includes('to부정사') ||
  f.includes('so-that')
);
if (relevant.length) {
  console.log('  관련 시드 파일:');
  for (const f of relevant) console.log(`    ${f}`);
} else {
  console.log('  관련 시드 파일 없음 (수동 확인 필요)');
  console.log('  전체 시드 파일 목록:');
  for (const f of seeds.slice(0, 20)) console.log(`    ${f}`);
  if (seeds.length > 20) console.log(`    ... 외 ${seeds.length - 20}개`);
}
