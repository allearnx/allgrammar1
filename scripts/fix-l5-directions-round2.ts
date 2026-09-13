/**
 * 지시문 보강 2차 (2026-09-13 사장님 지시)
 *  A. so that Step 1 Part 1 '괄호 안 고르기' 24문항: 원래 1번에만 [Part 1] 헤더가 있어 시트 분할 시
 *     지시문이 사라짐(5과 1단계 (4/5) 1~4번) → 각 문항에 "괄호 안에서 알맞은 표현을 고르시오." 부착
 *     (동일 유형 24문항이라 같은 지시문이 맞음. 템플릿 + 문장 일치 복사 시트 전부)
 *  B. 분사구문 3단계 문항 3건 (5과 3단계 (1/4) + 복사 시트 2곳):
 *     - <보기>에서 골라 한 문장으로 → "분사구문을 사용하여" 명시 (학생이 부사절로 써도 '한 문장'이라 정답키와 어긋남)
 *     - '기온이 높을수록': "어법에 맞게 고쳐" → 'the 비교급, the 비교급' 구문 사용 명시 (원문은 어법 오류가 없음)
 *     - "알맞을 말을" 오타 → "알맞은 말을"
 *  적용 후 시도 있는 시트 재채점 (오답 확인 화면 지문 갱신, 기존 정답 보존)
 *  실행: npx tsx --env-file=.env.local scripts/fix-l5-directions-round2.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
type Q = { number: number; question: string; answer: string; options?: string[] };
const PART1_DIR = '괄호 안에서 알맞은 표현을 고르시오.';
const EDITS: { label: string; test: (q: Q) => boolean; apply: (q: Q) => string }[] = [
  {
    label: '보기 골라 한 문장 → 분사구문 명시',
    test: (q) => /다음 <보기>에서 적절한 표현을 골라 한 문장으로 쓰시오\./.test(q.question) && /He felt bored/.test(q.question),
    apply: (q) => q.question.replace('다음 <보기>에서 적절한 표현을 골라 한 문장으로 쓰시오.', '다음 <보기>에서 적절한 표현을 골라 분사구문을 사용하여 한 문장으로 쓰시오.'),
  },
  {
    label: '기온이 높을수록 → the 비교급 구문 명시',
    test: (q) => /기온이 높을수록/.test(q.question) && /어법에 맞게 고쳐 쓰시오/.test(q.question),
    apply: (q) => q.question.replace('다음 우리말과 같은 뜻이 되도록 주어진 문장을 어법에 맞게 고쳐 쓰시오.', "다음 우리말과 같은 뜻이 되도록 'the 비교급 ~, the 비교급 ~' 구문을 사용하여 주어진 문장을 다시 쓰시오."),
  },
  { label: '알맞을 → 알맞은', test: (q) => /알맞을 말을/.test(q.question), apply: (q) => q.question.replace(/알맞을 말을/g, '알맞은 말을') },
];

async function main() {
  const admin = createAdminClient();
  const { data: tmpl } = await admin.from('naesin_templates').select('id, title, questions').ilike('title', 'so that Step 1%').single();
  const part1 = new Set(
    (tmpl!.questions as Q[]).filter((q) => q.options?.length === 2 && !/[가-힣]/.test(q.question)).map((q) => q.question.trim()),
  );
  console.log(`Part 1 대상 문장 ${part1.size}개 (템플릿 기준)`);

  const { data: tmpls } = await admin.from('naesin_templates').select('id, title, questions');
  const { data: sheets } = await admin.from('naesin_problem_sheets').select('id, title, questions').limit(3000);
  const targets = [
    ...(tmpls ?? []).map((t) => ({ table: 'naesin_templates' as const, ...t })),
    ...(sheets ?? []).map((s) => ({ table: 'naesin_problem_sheets' as const, ...s })),
  ];
  const backup: Record<string, unknown> = {};
  const touched: string[] = [];
  for (const t of targets) {
    const qs = (t.questions ?? []) as Q[];
    const log: string[] = [];
    for (const q of qs) {
      if (!q.question) continue;
      if (part1.has(q.question.trim())) {
        q.question = `${PART1_DIR}\n\n${q.question.trim()}`;
        log.push(`  #${q.number} [Part1 지시문] ${q.question.split('\n').pop()}`);
        continue;
      }
      for (const e of EDITS) {
        if (!e.test(q)) continue;
        const next = e.apply(q);
        if (next !== q.question) { q.question = next; log.push(`  #${q.number} [${e.label}] ${next.split('\n')[0].slice(0, 80)}`); }
      }
    }
    if (!log.length) continue;
    backup[`${t.table}_${t.id}`] = JSON.parse(JSON.stringify((t.questions as Q[])));
    console.log(`\n[${t.table}] ${t.title} (${t.id.slice(0, 8)}): ${log.length}문항`);
    console.log(log.slice(0, 5).join('\n') + (log.length > 5 ? `\n  … 외 ${log.length - 5}문항` : ''));
    if (!APPLY) continue;
    const { error } = await admin.from(t.table).update({ questions: qs }).eq('id', t.id);
    if (error) throw error;
    if (t.table === 'naesin_problem_sheets') touched.push(t.id);
  }
  writeFileSync(`${process.env.BACKUP_DIR ?? '.'}/l5-directions-round2-backup.json`, JSON.stringify(backup, null, 1));
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
