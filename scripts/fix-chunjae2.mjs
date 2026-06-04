import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = 'dc3155de-270a-48eb-b667-1fe4186d0f15';
const unit4 = 'a3d94bca-25a5-4f95-a91c-496f463cdc89';

// ============================================================
// 1. 접속사 although Step2 — 14건
// ============================================================
console.log('=== 1. 접속사 although Step2 수정 ===');

const { data: althoughSheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions, answer_key, source_template_id')
  .eq('unit_id', unit3)
  .ilike('title', '%although Step2%');

const aSheet = althoughSheets[0];
const aQs = [...aSheet.questions];
const aAk = [...(aSheet.answer_key || [])];

const althoughFixes = [
  // Q1: "If he says no, I won't go either" = 조건문
  { num: 1, newAnswer: 'If' },
  // Q2: 보기에 "though"만 있음 (Although 없음)
  { num: 2, newAnswer: 'Though' },
  // Q3: 길치라서 길을 잃음 = 인과관계 → because
  { num: 3, newAnswer: 'because' },
  // Q6: 날씨 좋으면 피크닉 = 조건 → If
  { num: 6, newAnswer: 'If' },
  // Q26: though절이 양보절이어야 함
  { num: 26, newAnswer: 'Though Korea is a small country, it has a long history.' },
  // Q27: Rick was late = 양보절
  { num: 27, newAnswer: 'Though Rick was late for the meeting, he didn\'t run at all.' },
  // Q28: Tom is careful = 양보절
  { num: 28, newAnswer: 'Though Tom is a careful driver, he has had some accidents.' },
  // Q38: 주어진 단어 전부 사용한 완전한 문장
  { num: 38, newAnswer: 'Though fruit is good for his health, he doesn\'t like it.' },
  // Q40: 열심히 공부해서 A = 인과 → since
  { num: 40, newAnswer: 'since' },
  // Q41: 빈칸에 접속사만 들어감
  { num: 41, newAnswer: 'Although' },
  // Q42: 빈칸에 접속사만 들어감
  { num: 42, newAnswer: 'Although' },
  // Q43: Although절 → In spite of + 명사구 전환
  { num: 43, newAnswer: 'In spite of' },
  // Q44: 빈칸 4개 = Although he was poor,
  { num: 44, newAnswer: 'Although he was poor,' },
  // Q46: "지도" = map (support가 아님), get → getting there
  { num: 46, newAnswer: 'Though Steve didn\'t have a map, he had no difficulty getting there.' },
];

for (const { num, newAnswer } of althoughFixes) {
  const idx = aQs.findIndex(q => q.number === num);
  if (idx === -1) { console.log(`  ⚠️ Q${num} not found`); continue; }
  const old = aQs[idx].answer;
  aQs[idx] = { ...aQs[idx], answer: newAnswer };
  aAk[idx] = newAnswer;
  console.log(`  Q${num}: "${old}" → "${newAnswer}"`);
}

const { error: e1 } = await sb.from('naesin_problem_sheets')
  .update({ questions: aQs, answer_key: aAk }).eq('id', aSheet.id);
console.log(e1 ? `  ❌ ${e1.message}` : `  ✅ 14건 저장 완료`);

// ============================================================
// 2. 수동태 step2 — 4건
// ============================================================
console.log('\n=== 2. 수동태 step2 수정 ===');

const { data: passiveSheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions, answer_key, source_template_id')
  .eq('unit_id', unit3)
  .ilike('title', '%수동태 step2%');

const pSheet = passiveSheets[0];
const pQs = [...pSheet.questions];
const pAk = [...(pSheet.answer_key || [])];

const passiveFixes = [
  // Q4: 빈칸 3개 + music → "is interested in music"
  { num: 4, newAnswer: 'is interested in' },
  // Q33: "사랑받아오고 있다" = 현재완료 수동태, 주어진 단어에 have/be 포함
  { num: 33, newAnswer: 'The movie has been loved by many people.' },
  // Q39: 예시문이 아닌 실제 답 (King Sejong, Hanguel, 1443)
  { num: 39, newAnswer: 'Hanguel was made by King Sejong the Great in 1443.' },
  // Q55: 9단어 조건 충족
  { num: 55, newAnswer: 'The early worm is caught by the early bird.' },
];

for (const { num, newAnswer } of passiveFixes) {
  const idx = pQs.findIndex(q => q.number === num);
  if (idx === -1) { console.log(`  ⚠️ Q${num} not found`); continue; }
  const old = pQs[idx].answer;
  pQs[idx] = { ...pQs[idx], answer: newAnswer };
  pAk[idx] = newAnswer;
  console.log(`  Q${num}: "${old}" → "${newAnswer}"`);
}

const { error: e2 } = await sb.from('naesin_problem_sheets')
  .update({ questions: pQs, answer_key: pAk }).eq('id', pSheet.id);
console.log(e2 ? `  ❌ ${e2.message}` : `  ✅ 4건 저장 완료`);

// ============================================================
// 3. 템플릿 수정
// ============================================================
console.log('\n=== 3. 템플릿 수정 ===');

const sheetsToFix = [
  { sheet: aSheet, fixes: althoughFixes, label: '접속사 although Step2' },
  { sheet: pSheet, fixes: passiveFixes, label: '수동태 step2' },
];

for (const { sheet, fixes, label } of sheetsToFix) {
  if (!sheet.source_template_id) {
    console.log(`\n  ⚠️ ${label}: 템플릿 없음 (직접 생성)`);
    continue;
  }

  const { data: tmpl } = await sb
    .from('naesin_templates')
    .select('id, title, questions, answer_key')
    .eq('id', sheet.source_template_id)
    .single();

  if (!tmpl) {
    console.log(`\n  ⚠️ ${label}: 템플릿 ID ${sheet.source_template_id} 없음`);
    continue;
  }

  console.log(`\n  === 템플릿: ${tmpl.title} ===`);
  const tQs = [...tmpl.questions];
  const tAk = [...(tmpl.answer_key || [])];
  let fixCount = 0;

  for (const { num, newAnswer } of fixes) {
    const idx = tQs.findIndex(q => q.number === num);
    if (idx === -1) { console.log(`    ⚠️ Q${num} not found in template`); continue; }
    const old = tQs[idx].answer;
    if (old === newAnswer) continue; // already fixed
    tQs[idx] = { ...tQs[idx], answer: newAnswer };
    tAk[idx] = newAnswer;
    fixCount++;
    console.log(`    Q${num}: "${old}" → "${newAnswer}"`);
  }

  if (fixCount === 0) {
    console.log(`    (수정 사항 없음)`);
    continue;
  }

  const { error: te } = await sb.from('naesin_templates')
    .update({ questions: tQs, answer_key: tAk }).eq('id', tmpl.id);
  console.log(te ? `    ❌ ${te.message}` : `    ✅ 템플릿 ${fixCount}건 저장 완료`);

  // Fix other copies of this template
  const { data: copies } = await sb
    .from('naesin_problem_sheets')
    .select('id, title, questions, answer_key')
    .eq('source_template_id', tmpl.id)
    .neq('id', sheet.id);

  if (copies && copies.length > 0) {
    console.log(`    → 다른 ${copies.length}개 복사본도 수정`);
    for (const copy of copies) {
      const cQs = [...copy.questions];
      const cAk = [...(copy.answer_key || [])];
      let cFixed = 0;

      for (const { num, newAnswer } of fixes) {
        const cidx = cQs.findIndex(q => q.number === num);
        if (cidx === -1) continue;
        if (cQs[cidx].answer === newAnswer) continue;
        cQs[cidx] = { ...cQs[cidx], answer: newAnswer };
        cAk[cidx] = newAnswer;
        cFixed++;
      }

      if (cFixed === 0) continue;
      const { error: ce } = await sb.from('naesin_problem_sheets')
        .update({ questions: cQs, answer_key: cAk }).eq('id', copy.id);
      console.log(ce ? `      ❌ ${copy.title}: ${ce.message}` : `      ✅ ${copy.title}: ${cFixed}건 수정`);
    }
  }
}

// ============================================================
// 4. 시드 파일 확인
// ============================================================
console.log('\n=== 4. 시드 파일 확인 ===');
import { readdirSync } from 'fs';
const seeds = readdirSync('supabase/seeds').filter(f => f.endsWith('.sql'));
const relevant = seeds.filter(f =>
  f.includes('although') || f.includes('passive') || f.includes('수동태')
);
if (relevant.length) {
  console.log('  관련 시드 파일:');
  for (const f of relevant) console.log(`    ${f}`);
} else {
  console.log('  관련 시드 파일 없음');
}
