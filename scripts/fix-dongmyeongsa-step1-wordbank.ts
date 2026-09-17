/**
 * 동명사 Step1 1~4번 — <보기> 단어(play/eat/talk/go)가 객관식 선지로 들어가 있어
 * 정답(playing 등)을 고를 수 없거나(동아윤·YBM박), 원형(play)이 정답으로 저장됨(천재소).
 * 이동형 학생 신고 (2026-09-14). 템플릿(fa9d511c)은 정상(주관식) — 복사 시트 3장만 깨짐.
 *
 *  1. 시트 3장 Q1~4: options 제거 + short_answer + 정답 동명사 + 지시문 "(필요시 단어를 변형할 것)" + answer_key 동기화
 *     - 89be0f00 중1 동아윤 4과 (37문항) / 94d145aa 중1 천재소 4과 (42문항) / 2afe8533 중1 YBM박 6과 1단계 (1/5)
 *  2. 임시저장 초기화: 이동형(89be0f00, 1~4번 답만 제거) / 안지훈(94d145aa, 6/24 4문항 — 전부 리셋)
 *  3. 덤: 498f6e8b 중1 능률김 5과 2단계 (3/4) Q13 정답 "1 4" → "1, 4" (쉼표 누락, 정답 불가) + 재채점
 *  4. 덤: 템플릿 beafa65a 부사절 접속사 Step3 Q11·31~33 options 제거 (복사본 8a196ab8은 이미 정상)
 *  시도 기록은 3장 모두 0건 → 재채점 불필요.
 *  실행: npx tsx --env-file=.env.local scripts/fix-dongmyeongsa-step1-wordbank.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
type Q = { number: number; question: string; answer: string; type?: string; tag?: string; options?: string[]; [k: string]: unknown };

const SHEETS = ['89be0f00-2631-49c1-b1f2-481d37c9cd7a', '94d145aa-a551-4c3b-bc24-ff3b93aa64e9', '2afe8533-9a7f-4b30-a404-1de6cfffd122'];
const HEAD = '다음 <보기>에서 알맞은 단어를 골라 대화를 완성하시오. (필요시 단어를 변형할 것)\n\n<보기> play / eat / talk / go\n\n';
const FIX: Record<number, { answer: string; body: string }> = {
  1: { answer: 'playing', body: '(1) A: What does he do in his free time?\nB: He enjoys __________ with a ball.' },
  2: { answer: 'eating', body: '(2) A: How long does it take for him to eat?\nB: He always finishes __________ in 2 minutes.' },
  3: { answer: 'going', body: "(3) A: What is your pet's favorite activity?\nB: My dog Mongmong loves __________ for a walk." },
  4: { answer: 'talking', body: "(4) A: I'm studying for the test tomorrow. Can you stop __________?\nB: Sorry." },
};
const COMMA_SHEET = '498f6e8b-e7c3-499e-a21e-de19aa45ab36';
const TMPL_BUSA = 'beafa65a';
const COPY_BUSA = '8a196ab8';
const backup: Record<string, unknown> = {};

async function main() {
  const admin = createAdminClient();

  // 1. 동명사 Step1 시트 3장
  for (const id of SHEETS) {
    const { data: s } = await admin.from('naesin_problem_sheets').select('id, title, questions, answer_key').eq('id', id).single();
    if (!s) { console.log('⚠ 시트 없음', id); continue; }
    const qs = s.questions as Q[]; const ak = s.answer_key as (string | number)[];
    backup[`sheet_${id}`] = { questions: structuredClone(qs), answer_key: structuredClone(ak) };
    const log: string[] = [];
    for (const [n, f] of Object.entries(FIX).map(([k, v]) => [Number(k), v] as const)) {
      const idx = qs.findIndex((q) => q.number === n);
      const q = qs[idx];
      if (!q || !q.question.includes(f.body.split('\n')[1].slice(0, 20))) { console.log(`⚠ ${id.slice(0, 8)} Q${n} 본문 불일치 — 건너뜀`, q?.question.slice(0, 40)); continue; }
      const before = `${q.type}/${q.answer}/opts=${JSON.stringify(q.options)}`;
      delete q.options; q.type = 'short_answer'; q.tag = '빈칸'; q.answer = f.answer; q.question = HEAD + f.body;
      ak[idx] = f.answer;
      log.push(`Q${n} ${before} → short_answer/${f.answer}`);
    }
    console.log(`[SHEET ${id.slice(0, 8)} ${s.title}]\n  ${log.join('\n  ')}`);
    if (APPLY) { const { error } = await admin.from('naesin_problem_sheets').update({ questions: qs, answer_key: ak }).eq('id', id); if (error) throw error; }
  }

  // 2. 임시저장
  const { data: drafts } = await admin.from('naesin_problem_drafts').select('id, student_id, sheet_id, draft_data').in('sheet_id', SHEETS);
  for (const d of drafts ?? []) {
    const dd = d.draft_data as Record<string, unknown>; backup[`draft_${d.id}`] = structuredClone(dd);
    const am = { ...((dd.answersMap as Record<string, string>) ?? {}) };
    let next: Record<string, unknown>;
    if (dd.mode === 'paper_test') { for (const k of ['0', '1', '2', '3']) delete am[k]; next = { ...dd, answersMap: am }; }
    else next = { ...dd, answersMap: {}, score: { wrong: 0, correct: 0 }, wrongList: [], retryCorrectList: [], aiResultsMap: {}, answeredUpTo: 0, currentIndex: 0, overtimeQuestions: [] };
    console.log(`[DRAFT ${d.sheet_id.slice(0, 8)} stu=${d.student_id.slice(0, 8)} mode=${dd.mode}] answersMap ${JSON.stringify(dd.answersMap)} → ${JSON.stringify(next.answersMap)}`);
    if (APPLY) { const { error } = await admin.from('naesin_problem_drafts').update({ draft_data: next }).eq('id', d.id); if (error) throw error; }
  }

  // 3. 쉼표 누락 Q13
  {
    const { data: s } = await admin.from('naesin_problem_sheets').select('id, title, questions, answer_key').eq('id', COMMA_SHEET).single();
    const qs = s!.questions as Q[]; const ak = s!.answer_key as (string | number)[];
    backup[`sheet_${COMMA_SHEET}`] = { questions: structuredClone(qs), answer_key: structuredClone(ak) };
    const idx = qs.findIndex((q) => q.number === 13);
    if (qs[idx].answer === '1 4' && ak[idx] === '1 4') {
      qs[idx].answer = '1, 4'; ak[idx] = '1, 4';
      console.log(`[SHEET ${COMMA_SHEET.slice(0, 8)} ${s!.title}] Q13 "1 4" → "1, 4"`);
      if (APPLY) {
        const { error } = await admin.from('naesin_problem_sheets').update({ questions: qs, answer_key: ak }).eq('id', COMMA_SHEET); if (error) throw error;
        const r = await regradeSheet(COMMA_SHEET); console.log('  재채점', r);
      }
    } else console.log('⚠ Q13 상태가 예상과 다름 — 건너뜀', qs[idx].answer, ak[idx]);
  }

  // 4. 부사절 Step3 템플릿 options 제거 (복사본 구조로 맞춤)
  {
    const { data: tl } = await admin.from('naesin_templates').select('id, title, questions').eq('template_topic', '부사절 접속사');
    const t = tl?.find((x) => x.id.startsWith(TMPL_BUSA)); if (!t) throw new Error('템플릿 없음');
    const { data: cl } = await admin.from('naesin_problem_sheets').select('id, questions').eq('source_template_id', t.id);
    const cqs = (cl?.find((x) => x.id.startsWith(COPY_BUSA))?.questions ?? []) as Q[];
    const tqs = t.questions as Q[]; backup[`tmpl_${t.id}`] = structuredClone(tqs);
    const log: string[] = [];
    for (const n of [11, 31, 32, 33]) {
      const i = tqs.findIndex((q) => q.number === n); const cq = cqs.find((q) => q.number === n);
      if (i < 0 || !cq || !tqs[i].options) { log.push(`Q${n} 건너뜀`); continue; }
      const sameBody = tqs[i].question.split('\n')[0] === cq.question.split('\n')[0];
      if (!sameBody) { log.push(`Q${n} 본문 불일치 — 건너뜀`); continue; }
      tqs[i] = structuredClone(cq); log.push(`Q${n} ${JSON.stringify(backup[`tmpl_${t.id}`] && (backup[`tmpl_${t.id}`] as Q[])[i].options)} → 복사본 구조(subParts, options 없음)`);
    }
    console.log(`[TMPL ${t.id.slice(0, 8)} ${t.title}]\n  ${log.join('\n  ')}`);
    if (APPLY) { const { error } = await admin.from('naesin_templates').update({ questions: tqs }).eq('id', t.id); if (error) throw error; }
  }

  writeFileSync(new URL('../scripts/backups/dongmyeongsa-step1-wordbank-backup.json', import.meta.url), JSON.stringify(backup, null, 1));
  console.log(APPLY ? '\n✓ 적용 완료 (백업: scripts/backups/dongmyeongsa-step1-wordbank-backup.json)' : '\n[dry-run] --apply 로 적용');
}
main().catch((e) => { console.error(e); process.exit(1); });
