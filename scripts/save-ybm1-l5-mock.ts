/**
 * 중1 YBM(박준언) 5과 예상문제 1회·2회 저장 (2026-09-13) — 원문 그대로, category mock_exam
 *  실행: WORK_DIR=<json 폴더> npx tsx --env-file=.env.local scripts/save-ybm1-l5-mock.ts [--apply]
 */
import { readFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeQuestions, validateProblemStructure, validateBeforeSave } from '@/lib/validation/problem-validator';
import type { NaesinProblemQuestion } from '@/types/naesin';

const APPLY = process.argv.includes('--apply');
const WORK = process.env.WORK_DIR ?? '.';
const ANCHOR = '28371bb4'; // 5과 문법 1단계 (3/5) — 같은 unit
const { R1, R2 } = JSON.parse(readFileSync(`${WORK}/ybm1-l5-mock.json`, 'utf8')) as { R1: NaesinProblemQuestion[]; R2: NaesinProblemQuestion[] };

async function main() {
  const admin = createAdminClient();
  const { data: anchor } = await admin.from('naesin_problem_sheets').select('id, unit_id, textbook_id').limit(3000);
  const a = anchor!.find((s) => s.id.startsWith(ANCHOR))!;
  const { data: existing } = await admin.from('naesin_problem_sheets').select('title').eq('unit_id', a.unit_id).eq('category', 'mock_exam');
  console.log('unit', a.unit_id, '기존 예상문제:', existing?.map((s) => s.title).join(', ') || '없음');
  for (const [title, raw] of [['5과 예상문제 1회', R1], ['5과 예상문제 2회', R2]] as const) {
    const db = raw.map((q, i) => ({ ...q, number: i + 1, options: q.options?.length ? q.options : undefined }));
    const { questions, answerKey } = sanitizeQuestions(db as NaesinProblemQuestion[], db.map((q) => q.answer));
    const st = validateProblemStructure(questions);
    const pre = validateBeforeSave(questions);
    console.log(`\n[${title}] ${questions.length}문항 / 구조 error ${st.errorCount} warn ${st.warningCount} / 저장전 error ${pre.errors.length} warn ${pre.warnings.length}`);
    for (const i of [...st.issues, ...pre.errors, ...pre.warnings]) console.log(`  [${i.severity}] #${i.questionNumber ?? '-'} ${i.code}: ${i.message}`);
    if (questions.length !== raw.length) throw new Error('sanitize가 문항을 삭제함');
    if (!APPLY || st.errorCount > 0) continue;
    if (existing?.some((s) => s.title === title)) { console.log('  이미 존재 — 건너뜀'); continue; }
    const { data, error } = await admin.from('naesin_problem_sheets').insert({
      unit_id: a.unit_id, textbook_id: a.textbook_id, title, category: 'mock_exam', mode: 'interactive', sort_order: title.includes('1회') ? 0 : 1, questions, answer_key: answerKey,
    }).select('id').single();
    if (error) throw error;
    console.log('  저장', data.id);
  }
  if (APPLY) {
    const { data: prog } = await admin.from('naesin_student_progress').select('id').eq('unit_id', a.unit_id).eq('mock_exam_completed', true);
    if (prog?.length) { await admin.from('naesin_student_progress').update({ mock_exam_completed: false }).eq('unit_id', a.unit_id).eq('mock_exam_completed', true); console.log('mock_exam_completed 리셋', prog.length); }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
