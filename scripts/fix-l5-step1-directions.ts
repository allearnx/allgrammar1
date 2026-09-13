/**
 * 5과 1단계 (1/5)(2/5)(3/5) 분사구문 문항 지시문 정비 (2026-09-13 사장님 지시 — 문항별 판단)
 *  - (1/5)#1~3: 빈칸만 있고 분사구문 지시 없음 → 명시. 빈칸 수에 맞는 대안 답 인정
 *  - (1/5)#6~16: #4~5와 같이 "※ 분사구문 부분만 쓰시오" 통일. 접속사 유지형 대안 인정
 *  - (2/5)#13~14: 오류 수정 문항 — 부사절로 고쳐도 '올바른 문장'이라 "(분사구문은 그대로 둘 것)" 명시
 *  - (2/5)#15~23: 어색한 문구 정리 + #21~23 완전한 문장 안내 통일
 *  - (3/5)#2~8: 영어 라벨 [words: …] → (주어진 단어: …). 어순·표현 대안 인정
 *  문항 텍스트가 같은 모든 시트·템플릿에 전파. 시도 있는 시트 재채점(기존 정답 보존).
 *  실행: npx tsx --env-file=.env.local scripts/fix-l5-step1-directions.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
type Q = { number: number; question: string; answer: string; acceptedAnswers?: string[] };
const addAcc = (q: Q, list: string[]) => { q.acceptedAnswers = [...(q.acceptedAnswers ?? []), ...list.filter((a) => !(q.acceptedAnswers ?? []).includes(a))]; };
type Edit = { label: string; test: (q: Q) => boolean; apply: (q: Q) => void };
const has = (s: string) => (q: Q) => q.question.includes(s);
const EDITS: Edit[] = [
  // (1/5)
  { label: '(1/5)#1~3 분사구문 지시 명시', test: (q) => q.question.startsWith('두 문장의 뜻이 같도록 빈칸을 채우시오.') && /(After I finished my homework|When I was tired, I went to bed early|Although he was very tired, he kept working)/.test(q.question),
    apply: (q) => {
      q.question = q.question.replace('두 문장의 뜻이 같도록 빈칸을 채우시오.', '분사구문을 사용하여 두 문장의 뜻이 같도록 빈칸을 채우시오.');
      if (q.question.includes('After I finished my homework')) addAcc(q, ['Having finished']);
      if (q.question.includes('When I was tired, I went to bed early')) addAcc(q, ['When tired']);
      if (q.question.includes('Although he was very tired')) addAcc(q, ['Though very tired', 'Although very tired']);
    } },
  { label: '(1/5)#6~16 분사구문 부분만 안내 통일', test: (q) => q.question.startsWith('분사구문을 사용하여 다음 문장을 완성하시오.') && q.question.includes('____') && !q.question.includes('분사구문 부분만'),
    apply: (q) => { q.question = q.question.trimEnd() + ' ※ 분사구문 부분만 쓰시오.'; } },
  { label: '(1/5) 접속사 유지형 대안 인정', test: (q) => q.question.startsWith('분사구문을 사용하여 다음 문장을 완성하시오.') && /(After he finished the report|As Emma studied in the library|While they were having lunch|While they had dinner)/.test(q.question),
    apply: (q) => {
      if (q.question.includes('After he finished the report')) addAcc(q, ['Finishing the report']);
      if (q.question.includes('As Emma studied in the library')) addAcc(q, ['While studying in the library']);
      if (q.question.includes('While they were having lunch')) addAcc(q, ['While having lunch']);
      if (q.question.includes('While they had dinner')) addAcc(q, ['While having dinner']);
    } },
  // (2/5)
  { label: '(2/5)#13~14 분사구문 유지 명시', test: (q) => q.question.startsWith('문법적 오류를 찾아 고쳐 쓰시오.') && /(Being read a book, she was thinking|Being a cold winter, the lake froze)/.test(q.question) && !q.question.includes('그대로 둘 것'),
    apply: (q) => {
      q.question = q.question.replace('문법적 오류를 찾아 고쳐 쓰시오.', '문법적 오류를 찾아 고쳐 쓰시오. (분사구문은 그대로 둘 것)');
      if (q.question.includes('Being read a book')) addAcc(q, ['While reading a book, she was thinking about her plan.']);
    } },
  { label: '(2/5)#15~23 문구 정리 + 완전한 문장 안내', test: (q) => q.question.startsWith('다음 문장을 분사구문을 사용하여 문장을 다시 쓰시오.'),
    apply: (q) => {
      q.question = q.question.replace('다음 문장을 분사구문을 사용하여 문장을 다시 쓰시오.', '다음 문장을 분사구문을 사용하여 다시 쓰시오.');
      if (!q.question.includes('완전한 문장')) q.question = q.question.trimEnd() + ' ※ 완전한 문장으로 쓰시오.';
      if (q.question.includes("Since I didn't finish my homework")) addAcc(q, ['Not having finished my homework, I felt nervous.']);
    } },
  // (3/5)
  { label: '(3/5)#2~8 [words:] → (주어진 단어:) + 대안 인정', test: (q) => q.question.includes('(분사구문을 사용할 것)') && /\[words: [^\]]+\]/.test(q.question),
    apply: (q) => {
      q.question = q.question.replace(/\[words: ([^\]]+)\]/, '(주어진 단어: $1)');
      if (q.question.includes('부산에 갔을 때')) addAcc(q, ['When visiting Busan, I met James.']);
      if (q.question.includes('공원을 걷다가')) addAcc(q, ['Walking in the park, she saw a cat.']);
      if (q.question.includes('신나게 춤을 추면서')) addAcc(q, ['My little brother was cleaning the room, dancing happily.']);
      if (q.question.includes('돈이 없어서')) addAcc(q, ['Having no money, she decided to stay home.']);
    } },
];
const MAIN = ['d200d996-1aac-49df-974a-2fa191e3b8a2', 'b425e95b-b30c-4bb0-9c9e-3693337f9c0c', 'a6144048-5642-4b65-8a85-81f1e0642cb1'];

async function main() {
  const admin = createAdminClient();
  const { data: tmpls } = await admin.from('naesin_templates').select('id, title, questions');
  const { data: sheets } = await admin.from('naesin_problem_sheets').select('id, title, questions').limit(3000);
  const targets = [
    ...(tmpls ?? []).map((t) => ({ table: 'naesin_templates' as const, ...t })),
    ...(sheets ?? []).map((s) => ({ table: 'naesin_problem_sheets' as const, ...s })),
  ];
  const backup: Record<string, unknown> = {};
  const touched: string[] = [];
  const hit = new Map<string, number>();
  for (const t of targets) {
    const qs = (t.questions ?? []) as Q[];
    const log: string[] = [];
    for (const q of qs) {
      if (!q.question) continue;
      for (const e of EDITS) {
        if (!e.test(q)) continue;
        const accBefore = (q.acceptedAnswers ?? []).length;
        e.apply(q); hit.set(e.label, (hit.get(e.label) ?? 0) + 1);
        const accAdded = (q.acceptedAnswers ?? []).slice(accBefore);
        log.push(`  #${q.number} [${e.label}] → ${q.question.split('\n')[0].slice(0, 60)}${accAdded.length ? ` +인정 ${JSON.stringify(accAdded)}` : ''}`);
      }
    }
    if (!log.length) continue;
    backup[`${t.table}_${t.id}`] = JSON.parse(JSON.stringify(t.questions));
    console.log(`\n[${t.table}] ${t.title} (${t.id.slice(0, 8)}): ${log.length}건`);
    if (MAIN.includes(t.id)) console.log(log.join('\n'));
    if (!APPLY) continue;
    const { error } = await admin.from(t.table).update({ questions: qs }).eq('id', t.id);
    if (error) throw error;
    if (t.table === 'naesin_problem_sheets') touched.push(t.id);
  }
  console.log('\n규칙별 적용 수:', Object.fromEntries(hit));
  writeFileSync(`${process.env.BACKUP_DIR ?? '.'}/l5-step1-directions-backup.json`, JSON.stringify(backup, null, 1));
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
