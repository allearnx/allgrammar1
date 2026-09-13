/**
 * 미래엔 공통영어2 2과 문법 시트 제작 파이프라인 (세션 직접 투입, 2026-09-13)
 *  원본(scratchpad JSON, PDF를 직접 구조화) → 1:1 변형(Opus) → AI 검산 → 후처리·구조 검사 → 30문항 시트 저장 + 템플릿 등록
 *  실행: npx tsx --env-file=.env.local scripts/build-mirae-co2-l2.ts <phase>
 *    phase: paraphrase | verify | report | save
 *  중간 산출물은 WORK_DIR(기본 scratchpad)에 JSON으로 남김. 각 phase는 독립 실행·재실행 가능.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';
import { buildParaphrasePrompt, buildVerifyPrompt, PARAPHRASE_CHUNK_SIZE, VERIFY_CHUNK_SIZE } from '@/lib/naesin/paraphrase-prompts';
import { chunkPreservingGroups } from '@/lib/naesin/paraphrase-chunks';
import { rebuildBankSets } from '@/lib/naesin/word-bank-sets';
import { sanitizeQuestions, validateProblemStructure, validateBeforeSave } from '@/lib/validation/problem-validator';
import { normalizeQuestions, splitQuestionsIntoSets, toDbQuestion } from '@/components/dashboard/naesin-admin/content-dialogs/shared/question-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import type { NaesinProblemQuestion } from '@/types/naesin';

const WORK = process.env.WORK_DIR ?? '.';
const phase = process.argv[2];
const UNIT_TITLE = '조동사+have p.p. / suggest that+주어+(should)+동사원형 (고1 공통영어2)';
const UNIT_ID = 'e46f8413-ee47-477b-83f3-4498f90362df'; // 미래엔 공통영어 2 — Lesson 2
const TEXTBOOK_ID = '8be1d792-6845-41d3-a258-5967b3e0d74f';
const MODEL = 'claude-opus-5';
const CONCURRENCY = 3;
const SET_SIZE = Number(process.env.SET_SIZE ?? 30); // 시트당 문항 수 (183문항 → 31이면 6시트로 균형)
const SHEETS_ONLY = process.argv.includes('--sheets-only');

type Raw = Record<string, unknown> & { number: number; part?: string };
const load = <T>(name: string): T => JSON.parse(readFileSync(`${WORK}/${name}`, 'utf8')) as T;
const save = (name: string, data: unknown) => writeFileSync(`${WORK}/${name}`, JSON.stringify(data, null, 1));

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

const anthropic = new Anthropic();

async function paraphraseChunk(chunk: Raw[], attempt = 1): Promise<Raw[]> {
  const msg = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    messages: [{ role: 'user', content: buildParaphrasePrompt(chunk, UNIT_TITLE) }],
  }).finalMessage();
  const out = requireAiJsonArray<Raw>(msg, 'script.paraphrase');
  const byNum = new Map(out.map((q) => [Number(q.number), q]));
  const missing = chunk.filter((q) => !byNum.has(q.number)).map((q) => q.number);
  if (missing.length) {
    if (attempt < 3) { console.log(`  ↻ 청크 재시도 (누락 ${missing.join(',')})`); return paraphraseChunk(chunk, attempt + 1); }
    throw new Error(`변형 누락: ${missing.join(',')}`);
  }
  // 원본의 part·options 개수 검사, 원본 acceptedAnswers는 모델 결과와 합침
  return chunk.map((o) => {
    const p = byNum.get(o.number)!;
    const oOpts = Array.isArray(o.options) ? (o.options as unknown[]).length : 0;
    const pOpts = Array.isArray(p.options) ? (p.options as unknown[]).length : 0;
    if (oOpts !== pOpts) console.log(`  ⚠ #${o.number} 보기 수 불일치 원본 ${oOpts} → 변형 ${pOpts}`);
    const acc = [...new Set([...(Array.isArray(p.acceptedAnswers) ? p.acceptedAnswers as string[] : [])])];
    return { ...p, part: o.part, ...(acc.length ? { acceptedAnswers: acc } : {}) };
  });
}

async function runParaphrase() {
  const originals = load<Raw[]>('mirae-l2-originals.json');
  const chunks = chunkPreservingGroups(originals, PARAPHRASE_CHUNK_SIZE) as Raw[][];
  console.log(`원본 ${originals.length}문항 → ${chunks.length}청크, 모델 ${MODEL}`);
  const t0 = Date.now();
  const results = await mapLimit(chunks, CONCURRENCY, async (chunk, i) => {
    const r = await paraphraseChunk(chunk);
    console.log(`  ✓ 청크 ${i + 1}/${chunks.length} (${chunk[0].number}~${chunk[chunk.length - 1].number}) ${Math.round((Date.now() - t0) / 1000)}s`);
    return r;
  });
  const out = results.flat();
  rebuildBankSets(originals, out); // word bank 세트를 변형 정답으로 재조립 (소거법 보장)
  save('mirae-l2-paraphrased.json', out);
  console.log(`변형 완료 ${out.length}문항 → mirae-l2-paraphrased.json`);
}

async function runVerify() {
  const qs = load<Raw[]>('mirae-l2-paraphrased.json');
  const chunks: Raw[][] = [];
  for (let i = 0; i < qs.length; i += VERIFY_CHUNK_SIZE) chunks.push(qs.slice(i, i + VERIFY_CHUNK_SIZE));
  const t0 = Date.now();
  const results = await mapLimit(chunks, CONCURRENCY, async (chunk, i) => {
    const msg = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      messages: [{ role: 'user', content: buildVerifyPrompt(chunk.map(({ part: _p, ...q }) => q), UNIT_TITLE) }],
    }).finalMessage();
    const r = requireAiJsonArray<{ number: number; verdict: string; aiAnswer?: string; reason?: string }>(msg, 'script.verify');
    console.log(`  ✓ 검산 ${i + 1}/${chunks.length} ${Math.round((Date.now() - t0) / 1000)}s`);
    return r;
  });
  const issues = results.flat().filter((r) => r.verdict !== 'ok');
  save('mirae-l2-verify-issues.json', issues);
  console.log(`검산 완료: 지적 ${issues.length}건 → mirae-l2-verify-issues.json`);
  for (const is of issues) {
    const q = qs.find((x) => Number(x.number) === Number(is.number));
    console.log(`\n#${is.number} [${is.verdict}] ${is.reason}\n  AI답: ${is.aiAnswer ?? '-'}\n  저장답: ${q?.answer}\n  Q: ${String(q?.question ?? '').replace(/\n+/g, ' ⏎ ').slice(0, 200)}`);
  }
}

/** 변형본 → DB 문항 배열 (후처리 포함). save/report 공용 */
function buildFinal(): { questions: NaesinProblemQuestion[]; answerKey: (string | number | null)[]; parts: string[] } {
  const src = existsSync(`${WORK}/mirae-l2-final-input.json`) ? load<Raw[]>('mirae-l2-final-input.json') : load<Raw[]>('mirae-l2-paraphrased.json');
  const parts = src.map((q) => String(q.part ?? ''));
  const gen = normalizeQuestions(src.map(({ part: _p, ...q }) => q));
  const db = gen.map((q, i) => toDbQuestion(q, i));
  const { questions, answerKey } = sanitizeQuestions(db, db.map((q) => q.answer));
  return { questions, answerKey, parts };
}

function runReport() {
  const { questions, answerKey, parts } = buildFinal();
  const struct = validateProblemStructure(questions);
  const pre = validateBeforeSave(questions);
  console.log(`문항 ${questions.length} / answer_key ${answerKey.length} / P1 ${parts.filter((p) => p === 'P1').length} P2 ${parts.filter((p) => p === 'P2').length}`);
  console.log(`구조 검사: error ${struct.errorCount} warn ${struct.warningCount}`);
  for (const i of struct.issues) console.log(`  [${i.severity}] #${i.questionNumber ?? '-'} ${i.code}: ${i.message}`);
  console.log(`저장 전 검사: error ${pre.errors.length} warn ${pre.warnings.length}`);
  for (const i of [...pre.errors, ...pre.warnings]) console.log(`  [${i.severity}] #${i.questionNumber ?? '-'} ${i.code}: ${i.message}`);
  const noKo = questions.filter((q) => !/(시오|세요|쓰세요|고르세요|채우세요|고르면|것은\?)/.test(q.question.split('\n').slice(0, 3).join(' ')));
  console.log(`한국어 지시문 없음: ${noKo.length}건 ${noKo.map((q) => '#' + q.number).join(' ')}`);
  const bias: Record<string, number> = {};
  for (const q of questions) if (q.options && q.options.length >= 4) bias[String(q.answer)] = (bias[String(q.answer)] ?? 0) + 1;
  console.log('4지선다 이상 정답 분포:', bias);
  save('mirae-l2-final-preview.json', questions);
}

async function runSave() {
  const { questions, answerKey, parts } = buildFinal();
  const struct = validateProblemStructure(questions);
  if (struct.errorCount > 0) throw new Error(`구조 error ${struct.errorCount}건 — report로 확인 후 수정하세요`);
  const admin = createAdminClient();
  const { data: existing } = await admin.from('naesin_problem_sheets').select('id, title').eq('unit_id', UNIT_ID);
  if (existing?.length) throw new Error(`unit에 이미 시트 ${existing.length}개 존재: ${existing.map((s) => s.title).join(', ')}`);
  const gen = questions.map((q, i) => ({ number: q.number, question: q.question, options: q.options ?? null, answer: String(q.answer ?? ''), explanation: q.explanation ?? '', acceptedAnswers: q.acceptedAnswers, subParts: q.subParts, part: parts[i] }));
  const sets = splitQuestionsIntoSets(gen as never, SET_SIZE) as unknown as typeof gen[];
  console.log(`시트 ${sets.length}개: ${sets.map((s) => s.length).join(', ')}`);
  const inserted: string[] = [];
  for (let i = 0; i < sets.length; i++) {
    const qs = sets[i].map(({ part: _p, ...q }, idx) => ({ ...q, number: idx + 1, options: q.options ?? undefined, explanation: q.explanation || undefined, acceptedAnswers: q.acceptedAnswers?.length ? q.acceptedAnswers : undefined, subParts: q.subParts?.length ? q.subParts : undefined }));
    const row = { unit_id: UNIT_ID, textbook_id: TEXTBOOK_ID, title: `2과 문법 (${i + 1}/${sets.length})`, category: 'problem', mode: 'interactive', sort_order: i, questions: qs, answer_key: qs.map((q) => q.answer) };
    const { data, error } = await admin.from('naesin_problem_sheets').insert(row).select('id, title').single();
    if (error) throw error;
    inserted.push(`${data.title} ${data.id.slice(0, 8)} (${qs.length})`);
  }
  console.log('시트 저장:', inserted.join(' | '));
  void answerKey;
  if (SHEETS_ONLY) return;
  // 템플릿(문법 뱅크): 패턴별 Step 1(연습) / Step 2(실전·기출). 토픽에 [고등] 접두로 중등 토픽과 분리
  const byPart: Record<string, typeof gen> = { P1: [], P2: [] };
  gen.forEach((q) => byPart[q.part]?.push(q));
  const TOPIC: Record<string, string> = { P1: '[고등] 조동사+have p.p.', P2: '[고등] suggest that+주어+(should)+동사원형' };
  for (const part of ['P1', 'P2']) {
    const all = byPart[part];
    // 실전·기출 = 뒤쪽 객관식 실전 블록: 원본 순서상 마지막 연속 구간 (P1: 실전 10+기출 2, P2: 실전 9+기출 1)
    const practicalCount = part === 'P1' ? 12 : 10;
    const step1 = all.slice(0, all.length - practicalCount);
    const step2 = all.slice(all.length - practicalCount);
    for (const [step, list] of [[1, step1], [2, step2]] as const) {
      const qs = list.map(({ part: _p, ...q }, idx) => ({ ...q, number: idx + 1, options: q.options ?? undefined, explanation: q.explanation || undefined, acceptedAnswers: q.acceptedAnswers?.length ? q.acceptedAnswers : undefined, subParts: q.subParts?.length ? q.subParts : undefined }));
      const row = { title: `${TOPIC[part]} Step ${step}${step === 1 ? ' (연습)' : ' (실전·기출)'}`, template_topic: TOPIC[part], category: 'problem', mode: 'interactive', questions: qs, answer_key: qs.map((q) => q.answer) };
      const { data, error } = await admin.from('naesin_templates').insert(row).select('id, title').single();
      if (error) throw error;
      console.log('템플릿 저장:', data.title, data.id.slice(0, 8), `(${qs.length})`);
    }
  }
}

(async () => {
  if (phase === 'paraphrase') await runParaphrase();
  else if (phase === 'verify') await runVerify();
  else if (phase === 'report') runReport();
  else if (phase === 'save') await runSave();
  else { console.error('phase: paraphrase | verify | report | save'); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
