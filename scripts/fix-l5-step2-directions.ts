/**
 * 5과 2단계 (1/5)~(5/5) 지시문 정비 (2026-09-13 사장님 지시 — 문항별 판단)
 *  - 영어 지시문(Choose all the things…) → 한국어 + (정답 n개)
 *  - 조합형 보기(①③ 등)인데 "모두 고르면?"/"(정답 2개)" → "…끼리 바르게 짝지어진 것은?"
 *    (UI가 '모두 고르'를 보고 복수선택으로 바뀌어 조합형 단일정답과 어긋남)
 *  - 밑줄이 없는데 "밑줄 친 부분" 지시문 → 밑줄 추가 또는 문구 정정
 *  - 객관식 배열 문항의 서술형 지시문 → "바르게 배열한 것은?"
 *  문항 텍스트가 같은 모든 시트·템플릿에 전파. 시도 있는 시트 재채점(기존 정답 보존).
 *  실행: npx tsx --env-file=.env.local scripts/fix-l5-step2-directions.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
type Q = { number: number; question: string; answer: string; options?: string[] };
type Edit = { label: string; test: (q: Q) => boolean; apply: (q: Q) => void };
const rep = (from: string, to: string) => (q: Q) => { q.question = q.question.replace(from, to); };
const EDITS: Edit[] = [
  { label: '(1/5)#4 정답 3개 안내', test: (q) => q.question.startsWith('다음 빈칸에 들어갈 알맞은 것을 모두 고르면?') && q.question.includes('Because I was raised in the countryside') && !q.question.includes('정답 3개'),
    apply: rep('다음 빈칸에 들어갈 알맞은 것을 모두 고르면?', '다음 빈칸에 들어갈 알맞은 것을 모두 고르면? (정답 3개)') },
  { label: '(1/5)#10 영어 지시문 → 한국어', test: (q) => q.question.startsWith('Choose all the things that fit in the blank.') && q.question.includes('After he washed the dishes'),
    apply: rep('Choose all the things that fit in the blank.', '다음 빈칸에 들어갈 말로 알맞은 것을 모두 고르면? (정답 2개)') },
  { label: '(1/5)#11 밑줄 누락', test: (q) => q.question.includes('밑줄 친 부분을 분사구문으로') && q.question.includes('He left the room as he closed the door.') && !q.question.includes('<u>'),
    apply: rep('He left the room as he closed the door.', 'He left the room <u>as he closed the door</u>.') },
  { label: '(2/5)#7 영어 지시문 → 한국어', test: (q) => q.question.startsWith('Choose all the things that fit in the blank.') && q.question.includes('After she finished her project'),
    apply: rep('Choose all the things that fit in the blank.', '다음 빈칸에 들어갈 말로 알맞은 것을 모두 고르면? (정답 2개)') },
  { label: '(2/5)#15 밑줄 없는데 "밑줄 친 부분" → 문장 개수', test: (q) => q.question.startsWith('다음 밑줄 친 부분이 어법상 옳은 문장의 총 개수는?') && q.question.includes('Raining hard, I had to stay indoors') && !q.question.includes('<u>'),
    apply: rep('다음 밑줄 친 부분이 어법상 옳은 문장의 총 개수는?', '다음 중 어법상 옳은 문장의 총 개수는?') },
  { label: '(4/5)#5 조합형인데 모두 고르면 → 짝지어진 것은', test: (q) => q.question.startsWith('다음 문장과 의미가 같은 것을 <u>모두</u> 고르면?') && q.question.includes('She turned on the TV to watch the news.'),
    apply: rep('다음 문장과 의미가 같은 것을 <u>모두</u> 고르면?', '다음 문장과 의미가 같은 것끼리 바르게 짝지어진 것은?') },
  { label: '(4/5)#9 조합형인데 (정답 2개) → 짝지어진 것은', test: (q) => q.question.startsWith('다음 문장의 밑줄 친 부분과 의미가 같은 것은? (정답 2개)') && q.question.includes('We saved money <u>to take a vacation</u>'),
    apply: rep('다음 문장의 밑줄 친 부분과 의미가 같은 것은? (정답 2개)', '다음 문장의 밑줄 친 부분과 의미가 같은 것끼리 바르게 짝지어진 것은?') },
  { label: '(4/5)#13 조합형인데 모두 고르면 → 짝지어진 것은', test: (q) => q.question.startsWith('다음 우리말에 맞게 영작한 것을 <u>모두</u> 고르면?') && q.question.includes('Sam은 그 기차를'),
    apply: rep('다음 우리말에 맞게 영작한 것을 <u>모두</u> 고르면?', '다음 우리말에 맞게 영작한 것끼리 바르게 짝지어진 것은?') },
  { label: '(4/5)#20 조합형인데 (정답 2개) → 짝지어진 것은', test: (q) => q.question.startsWith('다음 중 어법상 어색한 문장은? (정답 2개)') && q.question.includes('I woke up early so that I will not be late.'),
    apply: rep('다음 중 어법상 어색한 문장은? (정답 2개)', '다음 중 어법상 어색한 문장끼리 바르게 짝지어진 것은?') },
  { label: '(5/5)#15 조합형인데 모두 고르면 → 짝지어진 것은', test: (q) => q.question.startsWith('다음 중 문장 전환이 바른 것을 <u>모두</u> 고르면?') && q.question.includes('I studied hard to pass. = I studied hard so that I could pass.'),
    apply: rep('다음 중 문장 전환이 바른 것을 <u>모두</u> 고르면?', '다음 중 문장 전환이 바른 것끼리 바르게 짝지어진 것은?') },
  { label: '(5/5)#7·8·9·11 객관식 배열 지시문', test: (q) => q.question.startsWith('다음 단어들을 바르게 배열하여 문장을 완성하시오.') && (q.options?.length ?? 0) >= 2,
    apply: rep('다음 단어들을 바르게 배열하여 문장을 완성하시오.', '다음 단어들을 바르게 배열한 것은?') },
];
const MAIN = ['9141cc87-a969-43d8-9e13-14ff5cf4690b', '8c8741fe-a19a-459d-a737-9be193bccb8a', 'eebad97f-ceea-45b9-ab07-960f50cc5e21', '5c47f79c-db9d-4a36-8917-6632939afe79', '74a28a5c-df7f-4dbb-a293-d2ee8d24a050'];

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
        e.apply(q); hit.set(e.label, (hit.get(e.label) ?? 0) + 1);
        log.push(`  #${q.number} [${e.label}] → ${q.question.split('\n')[0].slice(0, 70)}`);
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
  writeFileSync(`${process.env.BACKUP_DIR ?? '.'}/l5-step2-directions-backup.json`, JSON.stringify(backup, null, 1));
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
