/**
 * 학교 기출 시험지 OMR(image_answer) 시트 저장 — PDF는 그대로 첨부, 정답표(+문항 스텁)만 등록.
 *  JSON 형식: { "R1": { "pdf_url": "https://…pdf", "questions": [{number, question, options: ['①',…] | [], answer, acceptedAnswers?, subParts?}] }, … }
 *  실행: OMR_JSON=<path> UNIT_ID=<uuid> TEXTBOOK_ID=<uuid> TITLE_PREFIX="5~6과 기출" TITLE_SUFFIX=" (2학기 중간고사)" \
 *        npx tsx --env-file=.env.local scripts/save-omr-exam-sheets.ts [--apply]
 *  키 R1, R2, … 가 각각 "<TITLE_PREFIX> 1회<TITLE_SUFFIX>" 시트가 된다.
 *  options 가 비면 서술형(정규화 채점), 있으면 객관식(번호 채점). 학생 화면은 pdf_url iframe + 번호별 입력칸.
 */
import { readFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeQuestions, validateProblemStructure } from '@/lib/validation/problem-validator';
import type { NaesinProblemQuestion } from '@/types/naesin';

const APPLY = process.argv.includes('--apply');
const { OMR_JSON, UNIT_ID, TEXTBOOK_ID, TITLE_PREFIX, TITLE_SUFFIX = '' } = process.env;
if (!OMR_JSON || !UNIT_ID || !TEXTBOOK_ID || !TITLE_PREFIX) throw new Error('OMR_JSON, UNIT_ID, TEXTBOOK_ID, TITLE_PREFIX 환경변수 필요');
const rounds = JSON.parse(readFileSync(OMR_JSON, 'utf8')) as Record<string, { pdf_url: string; questions: NaesinProblemQuestion[] }>;

async function main() {
  const admin = createAdminClient();
  const { data: unit } = await admin.from('naesin_units').select('id, unit_number, title, textbook_id').eq('id', UNIT_ID!).single();
  if (!unit || unit.textbook_id !== TEXTBOOK_ID) throw new Error('unit/textbook 불일치');
  const { data: existing } = await admin.from('naesin_problem_sheets').select('title, sort_order').eq('unit_id', UNIT_ID!).eq('category', 'mock_exam');
  console.log(`unit ${unit.unit_number} "${unit.title}" 기존 시트:`, existing?.map((s) => s.title).join(', ') || '없음');
  let order = existing?.length ? Math.max(...existing.map((s) => s.sort_order ?? 0)) + 1 : 0;
  for (const [key, { pdf_url, questions: raw }] of Object.entries(rounds)) {
    const title = `${TITLE_PREFIX} ${key.replace(/^R/, '')}회${TITLE_SUFFIX}`;
    if (!/^https:\/\/.+\.pdf$/.test(pdf_url)) throw new Error(`${title}: pdf_url 형식 오류 ${pdf_url}`);
    const db = raw.map((q, i) => ({ ...q, number: i + 1, options: q.options?.length ? q.options : undefined }));
    const { questions, answerKey } = sanitizeQuestions(db as NaesinProblemQuestion[], db.map((q) => q.answer));
    // OMR은 학생이 PDF를 보고 번호만 고르므로 선지 스텁('①'…)에 마커가 없어도 정상 — 해당 규칙만 제외
    const OMR_IGNORED = /CIRCLED_OPTIONS_NO_MARKERS/;
    const raw_st = validateProblemStructure(questions);
    const st = { issues: raw_st.issues.filter((i) => !OMR_IGNORED.test(i.code)), errorCount: raw_st.issues.filter((i) => i.severity === 'error' && !OMR_IGNORED.test(i.code)).length, warningCount: raw_st.warningCount };
    const mcq = questions.filter((q) => q.options?.length).length;
    console.log(`\n[${title}] ${questions.length}문항 (객관식 ${mcq} / 서술형 ${questions.length - mcq}) / 구조 error ${st.errorCount} warn ${st.warningCount}`);
    for (const i of st.issues.filter((i) => i.severity === 'error' || !/NO_FORMAT_HINT|NO_EXPLANATION|ANSWER_BIAS/.test(i.code))) console.log(`  [${i.severity}] #${i.questionNumber ?? '-'} ${i.code}: ${i.message}`);
    if (questions.length !== raw.length) throw new Error('sanitize가 문항을 삭제함');
    const changed = questions.filter((q, i) => JSON.stringify(q.answer) !== JSON.stringify(db[i].answer) || JSON.stringify(q.options ?? []) !== JSON.stringify(db[i].options ?? []));
    if (changed.length) console.log('  sanitize 변경:', changed.map((q) => `#${q.number} answer=${q.answer} options=${(q.options ?? []).join('|')}`).join('; '));
    console.log('  answer_key:', answerKey.join(' '));
    if (!APPLY || st.errorCount > 0) { order++; continue; }
    if (existing?.some((s) => s.title === title)) { console.log('  이미 존재 — 건너뜀'); order++; continue; }
    const { data, error } = await admin.from('naesin_problem_sheets').insert({
      unit_id: UNIT_ID, textbook_id: TEXTBOOK_ID, title, category: 'mock_exam', mode: 'image_answer', pdf_url, sort_order: order++, questions, answer_key: answerKey,
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
