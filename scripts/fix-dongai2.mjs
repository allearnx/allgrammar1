import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = '43dcebb7-02bd-4b40-b611-8cd61de3705a';
const unit4 = '95de2f74-4e7a-428c-9b64-7191304b8112';

const fixDefs = [
  {
    sheetPattern: 'keep/make/find+목적어+목적격보어 Step1',
    unitId: unit3,
    fixes: [
      { num: 25, newAnswer: '3' },   // ③ 4형식, 나머지 5형식
      { num: 29, newAnswer: '5' },   // ⑤ happily→happy
      { num: 32, newAnswer: '5' },   // ⑤ freshly→fresh
    ],
  },
  {
    sheetPattern: 'keep/make/find+목적어+목적격보어 Step2',
    unitId: unit3,
    fixes: [
      { num: 13, newAnswer: 'A test makes us nervous' },
      { num: 16, newAnswer: 'You could not keep it forever' },
      { num: 23, newAnswer: 'makes water cold' },
    ],
  },
  {
    sheetPattern: 'tell+목적어+to부정사 Step1',
    unitId: unit4,
    fixes: [
      { num: 30, newAnswer: '5' },   // ⑤만 바른 영작
    ],
  },
  {
    sheetPattern: 'tell+목적어+to부정사 Step2',
    unitId: unit4,
    fixes: [
      { num: 52, newAnswer: '(A) the Fairy to take / (B) Cinderella to come back' },
      { num: 60, newAnswer: 'the princess to dance with him' },
      { num: 68, newAnswer: 'She told her son to clean his room' },
    ],
  },
];

for (const def of fixDefs) {
  console.log(`\n=== ${def.sheetPattern} ===`);

  const { data: sheets } = await sb
    .from('naesin_problem_sheets')
    .select('id, title, questions, answer_key, source_template_id')
    .eq('unit_id', def.unitId)
    .ilike('title', `%${def.sheetPattern}%`);

  if (!sheets || sheets.length === 0) {
    console.log('  ⚠️ 시트 없음');
    continue;
  }

  const sheet = sheets[0];
  const qs = [...sheet.questions];
  const ak = [...(sheet.answer_key || [])];

  for (const { num, newAnswer } of def.fixes) {
    const idx = qs.findIndex(q => q.number === num);
    if (idx === -1) { console.log(`  ⚠️ Q${num} not found`); continue; }
    const old = qs[idx].answer;
    qs[idx] = { ...qs[idx], answer: newAnswer };
    ak[idx] = newAnswer;
    console.log(`  Q${num}: "${(old || '').substring(0, 50)}" → "${newAnswer}"`);
  }

  const { error } = await sb.from('naesin_problem_sheets')
    .update({ questions: qs, answer_key: ak }).eq('id', sheet.id);
  console.log(error ? `  ❌ ${error.message}` : `  ✅ ${def.fixes.length}건 저장 완료`);

  // Fix template
  if (sheet.source_template_id) {
    const { data: tmpl } = await sb
      .from('naesin_templates')
      .select('id, title, questions, answer_key')
      .eq('id', sheet.source_template_id)
      .single();

    if (tmpl) {
      const tQs = [...tmpl.questions];
      const tAk = [...(tmpl.answer_key || [])];
      let tFixed = 0;

      for (const { num, newAnswer } of def.fixes) {
        const tidx = tQs.findIndex(q => q.number === num);
        if (tidx === -1) continue;
        if (tQs[tidx].answer === newAnswer) continue;
        tQs[tidx] = { ...tQs[tidx], answer: newAnswer };
        tAk[tidx] = newAnswer;
        tFixed++;
      }

      if (tFixed > 0) {
        const { error: te } = await sb.from('naesin_templates')
          .update({ questions: tQs, answer_key: tAk }).eq('id', tmpl.id);
        console.log(te ? `  ❌ 템플릿: ${te.message}` : `  ✅ 템플릿 ${tFixed}건 수정`);

        // Fix other copies
        const { data: copies } = await sb
          .from('naesin_problem_sheets')
          .select('id, title, questions, answer_key')
          .eq('source_template_id', tmpl.id)
          .neq('id', sheet.id);

        if (copies && copies.length > 0) {
          for (const copy of copies) {
            const cQs = [...copy.questions];
            const cAk = [...(copy.answer_key || [])];
            let cFixed = 0;

            for (const { num, newAnswer } of def.fixes) {
              const cidx = cQs.findIndex(q => q.number === num);
              if (cidx === -1) continue;
              if (cQs[cidx].answer === newAnswer) continue;
              cQs[cidx] = { ...cQs[cidx], answer: newAnswer };
              cAk[cidx] = newAnswer;
              cFixed++;
            }

            if (cFixed > 0) {
              const { error: ce } = await sb.from('naesin_problem_sheets')
                .update({ questions: cQs, answer_key: cAk }).eq('id', copy.id);
              console.log(ce ? `    ❌ ${copy.title}` : `    ✅ ${copy.title}: ${cFixed}건 수정`);
            }
          }
        }
      }
    }
  } else {
    console.log('  (템플릿 없음 — 직접 생성된 시트)');
  }
}

// Check student attempts
console.log('\n=== 학생 시도 확인 ===');
const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id')
  .in('unit_id', [unit3, unit4]);

const { count } = await sb
  .from('naesin_problem_attempts')
  .select('*', { count: 'exact', head: true })
  .in('sheet_id', sheets.map(s => s.id));

console.log(`학생 시도: ${count}건`);
