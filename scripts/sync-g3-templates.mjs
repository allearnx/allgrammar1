import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Get all 중3 textbooks
const { data: textbooks } = await sb
  .from('naesin_textbooks')
  .select('id, display_name')
  .eq('grade', 3)
  .eq('is_active', true);

console.log(`중3 교과서 ${textbooks.length}개\n`);

// Get all units for 중3 (3과/4과)
const tbIds = textbooks.map(t => t.id);
const { data: units } = await sb
  .from('naesin_units')
  .select('id, textbook_id, unit_number, title')
  .in('textbook_id', tbIds)
  .in('unit_number', [3, 4]);

const unitIds = units.map(u => u.id);

// Get all sheets with source_template_id
const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, unit_id, questions, answer_key, source_template_id')
  .in('unit_id', unitIds)
  .not('source_template_id', 'is', null);

console.log(`템플릿 연결된 시트: ${sheets.length}개\n`);

// Get all referenced templates
const templateIds = [...new Set(sheets.map(s => s.source_template_id))];
const { data: templates } = await sb
  .from('naesin_templates')
  .select('id, title, questions, answer_key')
  .in('id', templateIds);

const tmplMap = {};
for (const t of templates) tmplMap[t.id] = t;

// Find unit info
const unitMap = {};
for (const u of units) unitMap[u.id] = u;
const tbMap = {};
for (const t of textbooks) tbMap[t.id] = t;

// Compare each sheet's answers with its template
let totalDiffs = 0;
const fixBatch = []; // { templateId, fixes: [{num, newAnswer}] }

for (const sheet of sheets) {
  const tmpl = tmplMap[sheet.source_template_id];
  if (!tmpl) continue;

  const unit = unitMap[sheet.unit_id];
  const tb = tbMap[unit?.textbook_id];

  const diffs = [];
  for (let i = 0; i < sheet.questions.length; i++) {
    const sq = sheet.questions[i];
    const tq = tmpl.questions.find(q => q.number === sq.number);
    if (!tq) continue;

    const sheetAns = String(sq.answer || '').trim();
    const tmplAns = String(tq.answer || '').trim();

    if (sheetAns !== tmplAns) {
      diffs.push({
        num: sq.number,
        sheetAnswer: sheetAns,
        tmplAnswer: tmplAns,
      });
    }
  }

  if (diffs.length > 0) {
    console.log(`=== ${tb?.display_name} ${unit?.unit_number}과 — ${sheet.title} ===`);
    console.log(`  템플릿: ${tmpl.title}`);
    for (const d of diffs) {
      console.log(`  Q${d.num}: 시트="${d.sheetAnswer.substring(0, 60)}" vs 템플릿="${d.tmplAnswer.substring(0, 60)}"`);
    }
    totalDiffs += diffs.length;

    // Collect fixes
    const existing = fixBatch.find(f => f.templateId === tmpl.id);
    const fixes = diffs.map(d => ({ num: d.num, newAnswer: d.sheetAnswer }));
    if (existing) {
      // Merge (sheet answer should match for same template)
    } else {
      fixBatch.push({ templateId: tmpl.id, templateTitle: tmpl.title, fixes });
    }
    console.log('');
  }
}

console.log(`\n총 ${totalDiffs}건 차이 발견, ${fixBatch.length}개 템플릿 수정 필요`);

// Apply fixes
if (fixBatch.length > 0) {
  console.log('\n=== 템플릿 수정 ===');
  for (const batch of fixBatch) {
    const tmpl = tmplMap[batch.templateId];
    const tQs = [...tmpl.questions];
    const tAk = [...(tmpl.answer_key || [])];
    let fixed = 0;

    for (const { num, newAnswer } of batch.fixes) {
      const idx = tQs.findIndex(q => q.number === num);
      if (idx === -1) continue;
      tQs[idx] = { ...tQs[idx], answer: newAnswer };
      tAk[idx] = newAnswer;
      fixed++;
    }

    const { error } = await sb.from('naesin_templates')
      .update({ questions: tQs, answer_key: tAk })
      .eq('id', batch.templateId);
    console.log(error
      ? `  ❌ ${batch.templateTitle}: ${error.message}`
      : `  ✅ ${batch.templateTitle}: ${fixed}건 동기화`);

    // Also fix other copies of this template (non-중3 sheets)
    const { data: otherCopies } = await sb
      .from('naesin_problem_sheets')
      .select('id, title, unit_id, questions, answer_key')
      .eq('source_template_id', batch.templateId)
      .not('unit_id', 'in', `(${unitIds.join(',')})`);

    if (otherCopies && otherCopies.length > 0) {
      for (const copy of otherCopies) {
        const cQs = [...copy.questions];
        const cAk = [...(copy.answer_key || [])];
        let cFixed = 0;

        for (const { num, newAnswer } of batch.fixes) {
          const cidx = cQs.findIndex(q => q.number === num);
          if (cidx === -1) continue;
          if (String(cQs[cidx].answer || '').trim() === newAnswer) continue;
          cQs[cidx] = { ...cQs[cidx], answer: newAnswer };
          cAk[cidx] = newAnswer;
          cFixed++;
        }

        if (cFixed > 0) {
          const { error: ce } = await sb.from('naesin_problem_sheets')
            .update({ questions: cQs, answer_key: cAk }).eq('id', copy.id);
          console.log(ce
            ? `    ❌ 복사본 ${copy.title}`
            : `    ✅ 복사본 ${copy.title}: ${cFixed}건 동기화`);
        }
      }
    }
  }
}
