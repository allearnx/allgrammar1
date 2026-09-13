/**
 * 예상문제(mock_exam) 시트 저장 — 원문 그대로 구조화한 JSON({R1,R2,...})을 unit에 넣는다.
 *  실행: MOCK_JSON=<path> UNIT_ID=<uuid> TEXTBOOK_ID=<uuid> TITLE_PREFIX="5과 예상문제" \
 *        npx tsx --env-file=.env.local scripts/save-mock-exam-sheets.ts [--apply]
 *  JSON 키 R1, R2, … 가 각각 "<TITLE_PREFIX> 1회", "2회"… 시트가 된다.
 */
import { readFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeQuestions, validateProblemStructure, validateBeforeSave } from '@/lib/validation/problem-validator';
import type { NaesinProblemQuestion } from '@/types/naesin';

const APPLY = process.argv.includes('--apply');
const { MOCK_JSON, UNIT_ID, TEXTBOOK_ID, TITLE_PREFIX } = process.env;
if (!MOCK_JSON || !UNIT_ID || !TEXTBOOK_ID || !TITLE_PREFIX) throw new Error('MOCK_JSON, UNIT_ID, TEXTBOOK_ID, TITLE_PREFIX 환경변수 필요');
const rounds = JSON.parse(readFileSync(MOCK_JSON, 'utf8')) as Record<string, NaesinProblemQuestion[]>;

async function main() {
  const admin = createAdminClient();
  const { data: unit } = await admin.from('naesin_units').select('id, unit_number, textbook_id').eq('id', UNIT_ID!).single();
  if (!unit || unit.textbook_id !== TEXTBOOK_ID) throw new Error('unit/textbook 불일치');
  const { data: existing } = await admin.from('naesin_problem_sheets').select('title').eq('unit_id', UNIT_ID!).eq('category', 'mock_exam');
  console.log(`unit ${unit.unit_number}과 기존 예상문제:`, existing?.map((s) => s.title).join(', ') || '없음');
  let order = 0;
  for (const [key, raw] of Object.entries(rounds)) {
    const title = `${TITLE_PREFIX} ${key.replace(/^R/, '')}회`;
    const db = raw.map((q, i) => ({ ...q, number: i + 1, options: q.options?.length ? q.options : undefined }));
    const { questions, answerKey } = sanitizeQuestions(db as NaesinProblemQuestion[], db.map((q) => q.answer));
    const st = validateProblemStructure(questions);
    const pre = validateBeforeSave(questions);
    console.log(`\n[${title}] ${questions.length}문항 / 구조 error ${st.errorCount} warn ${st.warningCount} / 저장전 error ${pre.errors.length} warn ${pre.warnings.length}`);
    for (const i of [...st.issues, ...pre.errors, ...pre.warnings].filter((i) => i.severity === 'error' || !/NO_FORMAT_HINT|ANSWER_BIAS/.test(i.code))) console.log(`  [${i.severity}] #${i.questionNumber ?? '-'} ${i.code}: ${i.message}`);
    if (questions.length !== raw.length) throw new Error('sanitize가 문항을 삭제함');
    if (!APPLY || st.errorCount > 0) { order++; continue; }
    if (existing?.some((s) => s.title === title)) { console.log('  이미 존재 — 건너뜀'); order++; continue; }
    const { data, error } = await admin.from('naesin_problem_sheets').insert({
      unit_id: UNIT_ID, textbook_id: TEXTBOOK_ID, title, category: 'mock_exam', mode: 'interactive', sort_order: order++, questions, answer_key: answerKey,
    }).select('id').single();
    if (error) throw error;
    console.log('  저장', data.id);
  }
  if (APPLY) {
    const { data: prog } = await admin.from('naesin_student_progress').select('id').eq('unit_id', UNIT_ID!).eq('mock_exam_completed', true);
    if (prog?.length) { await admin.from('naesin_student_progress').update({ mock_exam_completed: false }).eq('unit_id', UNIT_ID!).eq('mock_exam_completed', true); console.log('mock_exam_completed 리셋', prog.length); }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
