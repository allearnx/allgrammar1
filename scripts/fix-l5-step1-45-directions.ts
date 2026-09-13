/**
 * 5과 1단계 (4/5)(5/5) 잔여 지시문 정비 (2026-09-13 사장님 지시)
 *  - (4/5)#5~23 'so that 구문으로 바꿔 쓰시오': 구조는 명시돼 있음 → "※ 완전한 문장으로 쓰시오" 통일
 *  - (5/5)#20~22 '다음 우리말을 영어로 쓰시오': 조건이 없어 to부정사 번역도 맞는 답이 됨 → so that 사용 명시
 *  문항 텍스트가 같은 모든 시트·템플릿에 전파. 시도 있는 시트 재채점(기존 정답 보존).
 *  실행: npx tsx --env-file=.env.local scripts/fix-l5-step1-45-directions.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
type Q = { number: number; question: string; answer: string };
type Edit = { label: string; test: (q: Q) => boolean; apply: (q: Q) => void };
const EDITS: Edit[] = [
  { label: '(4/5)#5~23 완전한 문장 안내', test: (q) => /^(\[Part \d+\]\s*)?다음 문장을 so that 구문으로 바꿔 쓰시오\./.test(q.question) && !q.question.includes('완전한 문장'),
    apply: (q) => { q.question = q.question.trimEnd() + ' ※ 완전한 문장으로 쓰시오.'; } },
  { label: '(5/5)#20~22 so that 사용 명시', test: (q) => q.question.startsWith('다음 우리말을 영어로 쓰시오.') && /(컴퓨터를 켜기 위해서 버튼을 눌렀다|소라는 영어를 열심히 공부하기 위해 책을 샀다|준호는 잘 자기 위해 불을 껐다)/.test(q.question),
    apply: (q) => { q.question = q.question.replace('다음 우리말을 영어로 쓰시오.', '다음 우리말을 so that을 사용하여 영어로 쓰시오.'); if (!q.question.includes('완전한 문장')) q.question = q.question.trimEnd() + ' ※ 완전한 문장으로 쓰시오.'; } },
];
const MAIN = ['4806e14d-b93b-4a0d-af67-95d6416506b5', '35ea0921-6433-4d17-a301-531c751c3c2a'];

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
        log.push(`  #${q.number} [${e.label}] → ${q.question.replace(/\n+/g, ' ⏎ ').slice(0, 110)}`);
      }
    }
    if (!log.length) continue;
    backup[`${t.table}_${t.id}`] = JSON.parse(JSON.stringify(t.questions));
    console.log(`\n[${t.table}] ${t.title} (${t.id.slice(0, 8)}): ${log.length}건`);
    if (MAIN.includes(t.id)) console.log(log.slice(0, 4).join('\n') + (log.length > 4 ? `\n  … 외 ${log.length - 4}건` : ''));
    if (!APPLY) continue;
    const { error } = await admin.from(t.table).update({ questions: qs }).eq('id', t.id);
    if (error) throw error;
    if (t.table === 'naesin_problem_sheets') touched.push(t.id);
  }
  console.log('\n규칙별 적용 수:', Object.fromEntries(hit));
  writeFileSync(`${process.env.BACKUP_DIR ?? '.'}/l5-step1-45-directions-backup.json`, JSON.stringify(backup, null, 1));
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
