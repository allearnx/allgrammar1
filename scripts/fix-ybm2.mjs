import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const unit4 = '55f67584-aa9a-42d3-8b27-5a40e050a9ea';

// Get the sheet
const { data: sheet } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions, answer_key, source_template_id')
  .eq('unit_id', unit4)
  .ilike('title', '%비교급%Step2%')
  .single();

if (!sheet) { console.log('시트를 찾을 수 없습니다.'); process.exit(1); }
console.log(`시트: ${sheet.title} (${sheet.id})`);

const fixes = [
  { num: 1, newAnswer: 'The more / the smarter' },
  { num: 13, newAnswer: 'The more expensive' },
  { num: 21, newAnswer: 'shorter / more tired' },
  { num: 22, newAnswer: 'more / less' },
  { num: 44, newAnswer: 'the angrier he is', acceptedAnswers: ['the more angry he is'] },
  {
    num: 51,
    newAnswer: '(1) That he had to do → What he had to do / (2) More beans he moved → The more beans he moved / (3) much candies → many candies',
  },
  {
    num: 54,
    newAnswer: '(1) the colder it becomes / (2) the more I liked it / (3) the better grades you will get / (4) the sooner you will be back',
  },
];

const qs = [...sheet.questions];
const ak = [...sheet.answer_key];

for (const fix of fixes) {
  const idx = qs.findIndex(q => q.number === fix.num);
  if (idx === -1) { console.log(`  ⚠️ Q${fix.num} 없음`); continue; }
  const old = qs[idx].answer;
  qs[idx] = { ...qs[idx], answer: fix.newAnswer };
  if (fix.acceptedAnswers) {
    qs[idx].acceptedAnswers = fix.acceptedAnswers;
  }
  ak[idx] = fix.newAnswer;
  console.log(`  Q${fix.num}: "${String(old).substring(0, 40)}" → "${fix.newAnswer.substring(0, 40)}"`);
}

// Save sheet
const { error } = await sb
  .from('naesin_problem_sheets')
  .update({ questions: qs, answer_key: ak })
  .eq('id', sheet.id);

console.log(error ? `\n❌ 시트 저장 실패: ${error.message}` : `\n✅ 시트 저장 완료 (${fixes.length}건)`);

// Template sync
if (sheet.source_template_id) {
  const { data: tmpl } = await sb
    .from('naesin_templates')
    .select('id, title, questions, answer_key')
    .eq('id', sheet.source_template_id)
    .single();

  if (tmpl) {
    const tqs = [...tmpl.questions];
    const tak = [...tmpl.answer_key];
    let fixed = 0;

    for (const fix of fixes) {
      const tidx = tqs.findIndex(q => q.number === fix.num);
      if (tidx === -1) continue;
      tqs[tidx] = { ...tqs[tidx], answer: fix.newAnswer };
      if (fix.acceptedAnswers) tqs[tidx].acceptedAnswers = fix.acceptedAnswers;
      tak[tidx] = fix.newAnswer;
      fixed++;
    }

    const { error: te } = await sb.from('naesin_templates')
      .update({ questions: tqs, answer_key: tak })
      .eq('id', tmpl.id);
    console.log(te
      ? `  ❌ 템플릿 "${tmpl.title}": ${te.message}`
      : `  ✅ 템플릿 "${tmpl.title}": ${fixed}건 동기화`);

    // Find other copies
    const { data: copies } = await sb
      .from('naesin_problem_sheets')
      .select('id, title, questions, answer_key')
      .eq('source_template_id', tmpl.id)
      .neq('id', sheet.id);

    if (copies && copies.length > 0) {
      for (const copy of copies) {
        const cqs = [...copy.questions];
        const cak = [...copy.answer_key];
        let cf = 0;
        for (const fix of fixes) {
          const cidx = cqs.findIndex(q => q.number === fix.num);
          if (cidx === -1) continue;
          if (String(cqs[cidx].answer || '').trim() === fix.newAnswer) continue;
          cqs[cidx] = { ...cqs[cidx], answer: fix.newAnswer };
          if (fix.acceptedAnswers) cqs[cidx].acceptedAnswers = fix.acceptedAnswers;
          cak[cidx] = fix.newAnswer;
          cf++;
        }
        if (cf > 0) {
          const { error: ce } = await sb.from('naesin_problem_sheets')
            .update({ questions: cqs, answer_key: cak }).eq('id', copy.id);
          console.log(ce
            ? `    ❌ 복사본 ${copy.title}`
            : `    ✅ 복사본 ${copy.title}: ${cf}건 동기화`);
        }
      }
    }
  }
} else {
  console.log('  (source_template_id 없음)');
}

// Check student attempts
const { data: attempts } = await sb
  .from('naesin_problem_attempts')
  .select('id, student_id, score, total, wrong_answers')
  .eq('sheet_id', sheet.id);

console.log(`\n학생 시도: ${(attempts || []).length}건`);
if (attempts && attempts.length > 0) {
  for (const a of attempts) {
    const affected = (a.wrong_answers || []).filter(w =>
      fixes.some(f => f.num === w.number)
    );
    if (affected.length > 0) {
      console.log(`  ⚠️ 학생 ${a.student_id}: ${affected.length}건 영향 가능`);
    }
  }
}
