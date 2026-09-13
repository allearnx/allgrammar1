/**
 * 5과 3단계 (2/4)(3/4)(4/4) 지시문·형식 정비 (2026-09-13 사장님 지시 — 문항별 판단)
 *  템플릿 so that Step 3 + 문항 텍스트가 같은 모든 시트에 전파. 적용 후 시도 있는 시트 재채점(기존 정답 보존).
 *  실행: npx tsx --env-file=.env.local scripts/fix-l5-step3-directions.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
type SP = { label: string; answer: string; acceptedAnswers?: string[] };
type Q = { number: number; question: string; answer: string; acceptedAnswers?: string[]; subParts?: SP[]; explanation?: string };
const addAcc = (q: Q, list: string[]) => { q.acceptedAnswers = [...(q.acceptedAnswers ?? []), ...list.filter((a) => !(q.acceptedAnswers ?? []).includes(a))]; };
const sp = (answers: string[], acc: string[][] = []): SP[] => answers.map((a, i) => ({ label: `(${i + 1})`, answer: a, ...(acc[i]?.length ? { acceptedAnswers: acc[i] } : {}) }));

type Edit = { label: string; test: (q: Q) => boolean; apply: (q: Q) => void };
const EDITS: Edit[] = [
  // ── 3단계 (2/4) ──
  { label: '(2/4)#1 잔여 번호 제거', test: (q) => /^\(1\) ⓐBecause he felt sleepy/m.test(q.question), apply: (q) => { q.question = q.question.replace(/^\(1\) (?=ⓐBecause he felt sleepy)/m, ''); } },
  { label: '(2/4)#2 잔여 번호 제거', test: (q) => /^\(3\) Being poor, Jack/m.test(q.question), apply: (q) => { q.question = q.question.replace(/^\(3\) (?=Being poor, Jack)/m, ''); } },
  { label: '(2/4)#15~18 괄호 고르기 지시문', test: (q) => q.question.startsWith('다음 문장에서 알맞은 것을 고르시오.') && /\([^()]+ \/ [^()]+\)/.test(q.question),
    apply: (q) => { q.question = q.question.replace('다음 문장에서 알맞은 것을 고르시오.', '다음 문장의 괄호 안에서 알맞은 것을 고르시오.'); } },
  ...([
    ["I'll ________ here ________ ________ you can ________ everything clearly.", "I'll (1)________ here (2)________ you can (3)________ everything clearly.", ['stay', 'so that', 'explain']],
    ['She decided to ________ the lecture ________ ________ she could ________ it later.', 'She decided to (1)________ the lecture (2)________ she could (3)________ it later.', ['record', 'so that', 'review']],
    ["Let's ________ the schedule ________ ________ we can ________ the package on time.", "Let's (1)________ the schedule (2)________ we can (3)________ the package on time.", ['check', 'so that', 'deliver']],
  ] as [string, string, string[]][]).map(([from, to, parts]): Edit => ({
    label: `(2/4)#19~21 빈칸 3개·subParts 3개로 정렬 (${parts[0]}/${parts[2]})`,
    test: (q) => q.question.includes(from),
    apply: (q) => {
      q.question = q.question.replace(from, to).replace('so that을 활용한 문장을 완성하시오.', 'so that을 활용한 문장을 완성하시오. ((2)에는 so that을 쓰시오)');
      q.subParts = sp(parts); q.answer = parts.join(', ');
      addAcc(q, [parts.join(' / '), `${parts[0]}, ${parts[2]}`, `${parts[0]} / ${parts[2]}`]);
    },
  })),
  // ── 3단계 (3/4) ──
  { label: '(3/4)#2~6 so that/, so 고친 부분만 쓰기 명시 + 가짜 subParts 제거',
    test: (q) => q.question.includes("therefore를 의미하면 콤마를 추가하여 ', so'라 고쳐 쓰시오.") && !q.question.includes('고친 부분만'),
    apply: (q) => {
      q.question = q.question.replace("', so'라 고쳐 쓰시오.", "', so'라 고쳐 쓰시오. (＜보기＞와 같이 고친 부분만 쓰시오.)");
      if (q.subParts?.length === 1 && q.subParts[0].answer === 'so') delete q.subParts;
    } },
  { label: '(3/4)#15 주어진 단어 없음 → so that·understand 명시', test: (q) => q.question.includes('모든 팀원이 계획을 이해할 수 있도록') && q.question.includes('주어진 단어를 사용하여 영작하시오.'),
    apply: (q) => { q.question = q.question.replace('다음 우리말과 일치하도록 주어진 단어를 사용하여 영작하시오.', '다음 우리말과 일치하도록 so that과 understand를 사용하여 빈칸을 완성하시오.'); } },
  { label: '(3/4)#16 주어진 단어 없음 → 빈칸 완성 + in order not to 인정', test: (q) => q.question.includes('중요한 내용을 놓치지 않도록 강의를 녹음했다') && q.question.includes('주어진 단어를 사용하여 영작하시오.'),
    apply: (q) => { q.question = q.question.replace('다음 우리말과 일치하도록 주어진 단어를 사용하여 영작하시오.', '다음 우리말과 일치하도록 빈칸에 알맞은 말을 쓰시오.'); addAcc(q, ['in order not to']); } },
  { label: '(3/4)#17 (1)(2) subParts + 빈칸 완성 지시문', test: (q) => q.question.includes('아이들이 그 영화를 이해할 수 있도록 자막을') && !q.subParts,
    apply: (q) => {
      q.question = q.question.replace('다음 우리말과 일치하도록 영작하시오.', '다음 우리말과 일치하도록 빈칸을 완성하시오.');
      q.subParts = sp(['so that children can understand the movie', 'so'], [[
        'so that the children can understand the movie', 'so that children could understand the movie', 'so that the children could understand the movie', 'so that kids can understand the movie', 'so that kids could understand the movie'], [', so']]);
    } },
  // ── 3단계 (4/4) ──
  { label: '(4/4)#1 현재진행 주절 → could→can', test: (q) => q.question.includes('The student is studying late at night') && q.answer === 'so that she could review',
    apply: (q) => { addAcc(q, ['so that she could review']); q.answer = 'so that she can review'; q.explanation = '주절이 현재진행형(is studying)이므로 so that she can review. (could도 인정)'; } },
  { label: '(4/4)#4~6 완전한 문장 안내', test: (q) => q.question.includes('다음 각 인물의 행동에 대한 적절한 목적을') && !q.question.includes('____') && !q.question.includes('완전한 문장'),
    apply: (q) => { q.question = q.question.trimEnd() + '\n\n※ 완전한 문장으로 쓰시오.'; } },
  { label: '(4/4)#14 subParts 3', test: (q) => q.question.includes('I took an earlier train ____') && !q.subParts,
    apply: (q) => { q.subParts = sp(['so that I could avoid the morning rush', 'so that she could finish the project on time', 'so that they could enjoy the performance from the front']); } },
  { label: '(4/4)#17 subParts 3', test: (q) => q.question.includes('We booked the tickets in advance. We wanted to get good seats.') && !q.subParts,
    apply: (q) => { q.subParts = sp(['We booked the tickets in advance so that we could get good seats.', 'She spoke quietly so that she could keep the baby asleep.', 'He will review the contract carefully so that he can avoid any misunderstandings.']); } },
  { label: '(4/4)#18 subParts 2', test: (q) => q.question.includes('공통으로 들어갈 말을 쓰고') && q.question.includes('Minji studied hard') && !q.subParts,
    apply: (q) => { q.subParts = sp(['so that', 'I prepared all night so that I could finish my presentation well.']); } },
  { label: '(4/4)#20 subParts 2', test: (q) => q.question.includes('나는 장학금을 받기 위해서 열심히 공부했다') && !q.subParts,
    apply: (q) => { q.subParts = sp(['in order to win the scholarship', 'so that I might win the scholarship'], [['I studied hard in order to win the scholarship.'], ['I studied hard so that I might win the scholarship.']]); } },
  { label: '(4/4)#21 subParts 2', test: (q) => q.question.includes('She handed him the notes. She wanted him to review them') && !q.subParts,
    apply: (q) => { q.subParts = sp(['She handed him the notes so that he could review them before the meeting.', 'The weather was so foggy that the flight was delayed.']); } },
];

const MAIN = ['1c4bd3b2-acc8-45db-8210-a6c2b033f0e9', '60a41fbc-5efb-43c5-8b88-31ed7f87fe8a', '1a6a39e3-975f-4ac7-8c76-47ae333ea379'];

async function main() {
  const admin = createAdminClient();
  const { data: tmpls } = await admin.from('naesin_templates').select('id, title, questions, answer_key');
  const { data: sheets } = await admin.from('naesin_problem_sheets').select('id, title, questions, answer_key').limit(3000);
  const targets = [
    ...(tmpls ?? []).map((t) => ({ table: 'naesin_templates' as const, ...t })),
    ...(sheets ?? []).map((s) => ({ table: 'naesin_problem_sheets' as const, ...s })),
  ];
  const backup: Record<string, unknown> = {};
  const touched: string[] = [];
  const hitCount = new Map<string, number>();
  for (const t of targets) {
    const qs = (t.questions ?? []) as Q[];
    const answerKey = (t.answer_key ?? []) as unknown[];
    const log: string[] = [];
    qs.forEach((q, i) => {
      if (!q.question) return;
      for (const e of EDITS) {
        if (!e.test(q)) continue;
        const beforeAns = q.answer;
        e.apply(q);
        hitCount.set(e.label, (hitCount.get(e.label) ?? 0) + 1);
        if (q.answer !== beforeAns) answerKey[i] = q.answer; // 정답 변경 시 answer_key 동기화
        log.push(`  #${q.number} [${e.label}]${q.answer !== beforeAns ? ` answer→${JSON.stringify(q.answer)}` : ''}`);
      }
    });
    if (!log.length) continue;
    backup[`${t.table}_${t.id}`] = JSON.parse(JSON.stringify({ questions: t.questions, answer_key: t.answer_key }));
    console.log(`\n[${t.table}] ${t.title} (${t.id.slice(0, 8)}): ${log.length}건`);
    if (MAIN.includes(t.id) || t.table === 'naesin_templates') console.log(log.join('\n'));
    if (!APPLY) continue;
    const payload = t.table === 'naesin_templates' ? { questions: qs, answer_key: qs.map((q) => q.answer) } : { questions: qs, answer_key: answerKey };
    const { error } = await admin.from(t.table).update(payload).eq('id', t.id);
    if (error) throw error;
    if (t.table === 'naesin_problem_sheets') touched.push(t.id);
  }
  console.log('\n규칙별 적용 수:', Object.fromEntries(hitCount));
  writeFileSync(`${process.env.BACKUP_DIR ?? '.'}/l5-step3-directions-backup.json`, JSON.stringify(backup, null, 1));
  if (!APPLY) return;
  for (const id of touched) {
    const before = await admin.from('naesin_problem_attempts').select('id, score').eq('sheet_id', id);
    if (!before.data?.length) continue;
    const r = await regradeSheet(id);
    const after = await admin.from('naesin_problem_attempts').select('id, score').eq('sheet_id', id);
    const bm = new Map(before.data.map((a) => [a.id, a.score]));
    const diffs = (after.data ?? []).filter((a) => bm.get(a.id) !== a.score).map((a) => `${a.id.slice(0, 8)} ${bm.get(a.id)}→${a.score}`);
    console.log(`재채점 ${id.slice(0, 8)}: 시도 ${r.total}건, 점수 변동 ${diffs.length}건 ${diffs.join(', ')}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
