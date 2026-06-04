import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const TEXTBOOK_NAME = '능률김';
const UNIT_NUMBERS = [3];
const GRADE = 1;

// Step 1: Find textbook
const { data: allTextbooks } = await sb
  .from('naesin_textbooks')
  .select('id, display_name, grade, publisher')
  .eq('grade', GRADE)
  .eq('is_active', true);

const textbook = allTextbooks.find(t => (t.display_name || '').includes(TEXTBOOK_NAME));
if (!textbook) {
  console.log(`"${TEXTBOOK_NAME}" 교과서를 찾을 수 없습니다.`);
  console.log('사용 가능:', allTextbooks.map(t => t.display_name).join(', '));
  process.exit(1);
}
console.log(`=== ${textbook.display_name} (${textbook.id}) ===`);

// Step 2: Get units
const { data: units } = await sb
  .from('naesin_units')
  .select('id, unit_number, title')
  .eq('textbook_id', textbook.id)
  .in('unit_number', UNIT_NUMBERS)
  .order('unit_number');

for (const u of units) {
  console.log(`  ${u.unit_number}과: ${u.title} (${u.id})`);
}
const unitIds = units.map(u => u.id);

// Step 3: Vocabulary
console.log('\n=== 1. 단어 암기 ===');
const { data: vocab, error: vocabErr } = await sb
  .from('naesin_vocabulary')
  .select('id, unit_id, front_text, back_text')
  .in('unit_id', unitIds);

if (vocabErr) {
  console.log('  ERROR:', vocabErr.message);
} else {
  for (const u of units) {
    const uv = (vocab || []).filter(v => v.unit_id === u.id);
    const emptyF = uv.filter(v => !v.front_text || !v.front_text.trim());
    const emptyB = uv.filter(v => !v.back_text || !v.back_text.trim());
    const issues = [];
    if (emptyF.length) issues.push(`빈 영어 ${emptyF.length}`);
    if (emptyB.length) issues.push(`빈 한글 ${emptyB.length}`);
    console.log(`  ${u.unit_number}과: ${uv.length}개 ${issues.length ? '⚠️ ' + issues.join(', ') : '✅'}`);
  }
}

// Step 4: Dialogues
console.log('\n=== 2. 대화문 암기 ===');
const { data: dialogues, error: diaErr } = await sb
  .from('naesin_dialogues')
  .select('id, unit_id, title, sentences')
  .in('unit_id', unitIds);

if (diaErr) {
  console.log('  ERROR:', diaErr.message);
} else {
  for (const u of units) {
    const ud = (dialogues || []).filter(d => d.unit_id === u.id);
    let total = 0, emptyOrig = 0, emptyKo = 0, emptySpeaker = 0;
    for (const d of ud) {
      const sents = d.sentences || [];
      total += sents.length;
      emptyOrig += sents.filter(s => !s.original || !s.original.trim()).length;
      emptyKo += sents.filter(s => !s.korean || !s.korean.trim()).length;
      emptySpeaker += sents.filter(s => !s.speaker || !s.speaker.trim()).length;
    }
    const issues = [];
    if (emptyOrig) issues.push(`빈 영어 ${emptyOrig}`);
    if (emptyKo) issues.push(`빈 한글 ${emptyKo}`);
    if (emptySpeaker) issues.push(`빈 화자 ${emptySpeaker}`);
    console.log(`  ${u.unit_number}과: ${ud.length}개 대화문, ${total}문장 ${issues.length ? '⚠️ ' + issues.join(', ') : '✅'}`);
  }
}

// Step 5: Passages
console.log('\n=== 3. 본문 암기 ===');
const { data: passages, error: passErr } = await sb
  .from('naesin_passages')
  .select('id, unit_id, title, sentences')
  .in('unit_id', unitIds);

if (passErr) {
  console.log('  ERROR:', passErr.message);
} else {
  for (const u of units) {
    const up = (passages || []).filter(p => p.unit_id === u.id);
    let total = 0, emptyOrig = 0, emptyKo = 0;
    for (const p of up) {
      const sents = p.sentences || [];
      total += sents.length;
      emptyOrig += sents.filter(s => !s.original || !s.original.trim()).length;
      emptyKo += sents.filter(s => !s.korean || !s.korean.trim()).length;
    }
    const issues = [];
    if (emptyOrig) issues.push(`빈 영어 ${emptyOrig}`);
    if (emptyKo) issues.push(`빈 한글 ${emptyKo}`);
    console.log(`  ${u.unit_number}과: ${total}문장 ${issues.length ? '⚠️ ' + issues.join(', ') : '✅'}`);
  }
}

// Step 6: Problem sheets
console.log('\n=== 4. 문제/정답 검증 ===');
const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, unit_id, title, questions, answer_key')
  .in('unit_id', unitIds)
  .order('title');

let totalQ = 0, totalEmpty = 0, totalMcq = 0, totalMismatch = 0, totalNoExp = 0;

for (const sheet of (sheets || [])) {
  const qs = sheet.questions || [];
  const ak = sheet.answer_key || [];
  const unitNum = units.find(u => u.id === sheet.unit_id)?.unit_number;
  totalQ += qs.length;

  const emptyAns = qs.filter(q => {
    const a = q.answer;
    return a === null || a === undefined || a === '' || (typeof a === 'string' && !a.trim());
  });

  const mcqRange = qs.filter(q => {
    if (q.type !== 'mcq') return false;
    const choices = q.choices || [];
    const ans = Number(q.answer);
    return !isNaN(ans) && (ans < 1 || ans > choices.length);
  });

  const mismatches = [];
  for (let i = 0; i < qs.length; i++) {
    const qA = String(qs[i].answer || '').replace(/\s/g, '');
    const akA = String(ak[i] || '').replace(/\s/g, '');
    if (qA !== akA) mismatches.push({ q: i + 1, qAns: qs[i].answer, akAns: ak[i] });
  }

  const noExp = qs.filter(q => !q.explanation || !q.explanation.trim());

  totalEmpty += emptyAns.length;
  totalMcq += mcqRange.length;
  totalMismatch += mismatches.length;
  totalNoExp += noExp.length;

  const issues = [];
  if (emptyAns.length) issues.push(`빈정답 ${emptyAns.length}`);
  if (mcqRange.length) issues.push(`MCQ범위초과 ${mcqRange.length}`);
  if (mismatches.length) issues.push(`정답불일치 ${mismatches.length}`);
  if (noExp.length) issues.push(`해설없음 ${noExp.length}`);

  const status = issues.length === 0 ? '✅' : '⚠️ ' + issues.join(', ');
  console.log(`  ${unitNum}과 ${sheet.title}: ${qs.length}문제 ${status}`);

  if (mismatches.length > 0) {
    for (const m of mismatches.slice(0, 3)) {
      console.log(`    Q${m.q}: questions="${m.qAns}" vs answer_key="${m.akAns}"`);
    }
    if (mismatches.length > 3) console.log(`    ... 외 ${mismatches.length - 3}건`);
  }
  if (mcqRange.length > 0) {
    const sample = qs.find(q => q.type === 'mcq' && (!q.choices || !q.choices.length || Number(q.answer) > (q.choices || []).length));
    if (sample) console.log(`    예시: choices=${JSON.stringify(sample.choices)}, answer=${sample.answer}`);
  }
}

console.log('\n========== 종합 ==========');
console.log(`총 시험지: ${(sheets || []).length}개`);
console.log(`총 문제: ${totalQ}개`);
console.log(`빈 정답: ${totalEmpty}개 ${totalEmpty === 0 ? '✅' : '❌'}`);
console.log(`MCQ 범위 초과: ${totalMcq}개 ${totalMcq === 0 ? '✅' : '❌'}`);
console.log(`정답 불일치: ${totalMismatch}개 ${totalMismatch === 0 ? '✅' : '❌'}`);
console.log(`해설 누락: ${totalNoExp}개 ${totalNoExp === 0 ? '✅' : '⚠️ 생성 필요'}`);
