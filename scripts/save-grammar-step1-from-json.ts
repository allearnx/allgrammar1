/**
 * 문법 1단계 시트 + 문법 뱅크(템플릿) 저장 — 워크북에서 원문 그대로 구조화한 JSON({P1,P2,...})을 넣는다.
 *  실행: GRAMMAR_JSON=<path> UNIT_ID=<uuid> TEXTBOOK_ID=<uuid> TITLE_PREFIX="8과 문법 1단계" \
 *        TOPICS='{"P1":"분사구문","P2":"과거완료"}' TEMPLATE_SUFFIX="(동아이 8과 워크북)" [SET_SIZE=27] [STEP=1] \
 *        npx tsx --env-file=.env.local scripts/save-grammar-step1-from-json.ts [--apply] [--sheets-only]
 *  - 템플릿: 파트별 "<topic> Step 1 <suffix>" (category problem / mode interactive)
 *  - 시트: 파트 순서대로 이어 붙여 SET_SIZE로 분할, "<TITLE_PREFIX> (i/N)", source_template_id는 파트 템플릿
 */
import { readFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeQuestions, validateProblemStructure, validateBeforeSave } from '@/lib/validation/problem-validator';
import type { NaesinProblemQuestion } from '@/types/naesin';

const APPLY = process.argv.includes('--apply');
const SHEETS_ONLY = process.argv.includes('--sheets-only');
const { GRAMMAR_JSON, UNIT_ID, TEXTBOOK_ID, TITLE_PREFIX, TOPICS, TEMPLATE_SUFFIX } = process.env;
const SET_SIZE = Number(process.env.SET_SIZE ?? 27);
const STEP = process.env.STEP ?? '1';
if (!GRAMMAR_JSON || !UNIT_ID || !TEXTBOOK_ID || !TITLE_PREFIX || !TOPICS) throw new Error('GRAMMAR_JSON, UNIT_ID, TEXTBOOK_ID, TITLE_PREFIX, TOPICS 환경변수 필요');
const parts = JSON.parse(readFileSync(GRAMMAR_JSON, 'utf8')) as Record<string, NaesinProblemQuestion[]>;
const topics = JSON.parse(TOPICS) as Record<string, string>;

function prepare(raw: NaesinProblemQuestion[], label: string) {
  const db = raw.map((q, i) => ({ ...q, number: i + 1, options: q.options?.length ? q.options : undefined }));
  const { questions, answerKey } = sanitizeQuestions(db as NaesinProblemQuestion[], db.map((q) => q.answer));
  const st = validateProblemStructure(questions);
  const pre = validateBeforeSave(questions);
  console.log(`\n[${label}] ${questions.length}문항 / 구조 error ${st.errorCount} warn ${st.warningCount} / 저장전 error ${pre.errors.length} warn ${pre.warnings.length}`);
  for (const i of [...st.issues, ...pre.errors, ...pre.warnings].filter((i) => i.severity === 'error' || !/NO_FORMAT_HINT|ANSWER_BIAS|NO_EXPLANATION/.test(i.code))) console.log(`  [${i.severity}] #${i.questionNumber ?? '-'} ${i.code}: ${i.message}`);
  if (questions.length !== raw.length) throw new Error(`${label}: sanitize가 문항을 삭제함`);
  if (st.errorCount > 0) throw new Error(`${label}: 구조 error`);
  return { questions, answerKey };
}

function chunk<T>(arr: T[], size: number): T[][] {
  // 균등 분할: 마지막 시트가 너무 작아지지 않도록 n = ceil(len/size), 각 시트 floor/ceil
  const n = Math.ceil(arr.length / size);
  const base = Math.floor(arr.length / n);
  const extra = arr.length % n;
  const out: T[][] = [];
  let i = 0;
  for (let k = 0; k < n; k++) { const len = base + (k < extra ? 1 : 0); out.push(arr.slice(i, i + len)); i += len; }
  return out;
}

async function main() {
  const admin = createAdminClient();
  const { data: unit } = await admin.from('naesin_units').select('id, unit_number, textbook_id').eq('id', UNIT_ID!).single();
  if (!unit || unit.textbook_id !== TEXTBOOK_ID) throw new Error('unit/textbook 불일치');
  const { data: existing } = await admin.from('naesin_problem_sheets').select('title, sort_order').eq('unit_id', UNIT_ID!).eq('category', 'problem');
  console.log(`unit ${unit.unit_number}과 기존 문법 시트:`, existing?.map((s) => s.title).join(', ') || '없음');
  const { data: tplExisting } = await admin.from('naesin_templates').select('title, template_topic').in('template_topic', Object.values(topics));
  console.log('기존 동일 토픽 템플릿:', tplExisting?.map((t) => t.title).join(', ') || '없음');

  const prepared: Record<string, { questions: NaesinProblemQuestion[]; answerKey: string[] }> = {};
  for (const [key, raw] of Object.entries(parts)) prepared[key] = prepare(raw, `${key} ${topics[key]}`);

  // 1) 템플릿
  const templateIds: Record<string, string | null> = {};
  for (const key of Object.keys(parts)) {
    const title = `${topics[key]} Step ${STEP} ${TEMPLATE_SUFFIX ?? ''}`.trim();
    if (!APPLY || SHEETS_ONLY) { templateIds[key] = null; console.log(`템플릿 예정: ${title} (${prepared[key].questions.length})`); continue; }
    if (tplExisting?.some((t) => t.title === title)) throw new Error(`템플릿 이미 존재: ${title}`);
    const { data, error } = await admin.from('naesin_templates').insert({ title, template_topic: topics[key], category: 'problem', mode: 'interactive', questions: prepared[key].questions, answer_key: prepared[key].answerKey }).select('id').single();
    if (error) throw error;
    templateIds[key] = data.id;
    console.log(`템플릿 저장: ${title} ${data.id}`);
  }

  // 2) 시트: 파트별로 분할(파트 경계 유지), 전체 번호는 (i/N)
  const chunks: { key: string; qs: NaesinProblemQuestion[] }[] = [];
  for (const key of Object.keys(parts)) for (const qs of chunk(prepared[key].questions, SET_SIZE)) chunks.push({ key, qs });
  const N = chunks.length;
  console.log(`\n시트 ${N}개:`, chunks.map((c) => `${c.key}×${c.qs.length}`).join(', '));
  const startOrder = (existing?.length ? Math.max(...existing.map((s) => s.sort_order ?? 0)) + 1 : 0);
  for (let i = 0; i < N; i++) {
    const title = `${TITLE_PREFIX} (${i + 1}/${N})`;
    const qs = chunks[i].qs.map((q, idx) => ({ ...q, number: idx + 1 }));
    if (!APPLY) continue;
    if (existing?.some((s) => s.title === title)) throw new Error(`시트 이미 존재: ${title}`);
    const { data, error } = await admin.from('naesin_problem_sheets').insert({
      unit_id: UNIT_ID, textbook_id: TEXTBOOK_ID, title, category: 'problem', mode: 'interactive', sort_order: startOrder + i,
      questions: qs, answer_key: qs.map((q) => q.answer), source_template_id: templateIds[chunks[i].key],
    }).select('id').single();
    if (error) throw error;
    console.log(`  저장 ${title} ${data.id} (${qs.length})`);
  }
  if (APPLY) {
    const { data: prog } = await admin.from('naesin_student_progress').select('id').eq('unit_id', UNIT_ID!).eq('problem_completed', true);
    if (prog?.length) { await admin.from('naesin_student_progress').update({ problem_completed: false }).eq('unit_id', UNIT_ID!).eq('problem_completed', true); console.log('problem_completed 리셋', prog.length); }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
