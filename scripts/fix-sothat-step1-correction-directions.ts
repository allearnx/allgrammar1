/**
 * so that Step 1 '틀린 부분 고쳐 쓰기' 15문항(#51~65) 지시문에 목표 구문 명시 (2026-09-13 사장님 지시)
 *  - 기출체 "~을 사용하여": so ~ that / so that / in order to / to부정사 를 문항별 정답 구조에 맞춰 명시
 *  - 지시문과 어긋나는 인정답안(58·61·62의 타 구문 답)은 제거 — 기존 정답 시도는 regrade 보존 로직으로 유지
 *  - 템플릿 + 문장 일치 복사 시트 전부. 적용 후 재채점(오답 확인 화면의 문제 지문 갱신)
 *  실행: npx tsx --env-file=.env.local scripts/fix-sothat-step1-correction-directions.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
type Rule = { sentence: string; direction: string; keepAccepted?: (a: string) => boolean };
// 문항별 지시문 — 오류 성격에 맞춰 판단 (일괄 "~을 사용하여" 금지, 2026-09-13 사장님)
//  · 구문을 새로 세워야 하는 문항만 구문 지정("~을 사용하여")
//  · 구문은 있는데 안에서 한 단어가 틀림 → "한 단어만 고쳐" / 단어 누락 → "한 단어를 추가하여" / 어순 → "어순이 잘못된 부분"
//  · so what/so which처럼 정답이 곧 so that인 문항은 구문을 적으면 답이 되므로 "한 단어만 고쳐"
const ONE_WORD_FIX = '다음 문장에서 어법상 틀린 부분을 찾아 한 단어만 고쳐 올바른 문장 전체를 쓰시오.';
const ONE_WORD_ADD = '다음 문장에서 어법상 틀린 부분을 찾아 한 단어를 추가하여 올바른 문장 전체를 쓰시오.';
const WORD_ORDER = '다음 문장에서 어순이 잘못된 부분을 찾아 올바른 문장 전체를 고쳐 쓰시오.';
const USE = (구문: string) => `다음 문장에서 틀린 부분을 찾아 ${구문} 사용하여 올바른 문장 전체를 고쳐 쓰시오.`;
const RULES: Rule[] = [
  { sentence: 'Mr. Kim is so kind that his students like.', direction: ONE_WORD_ADD },                       // + him
  { sentence: 'The place was beautiful so that they wanted to live there.', direction: USE('so ~ that 구문을') }, // 결과 구문으로 재구성
  { sentence: 'I often stop working so that can take a rest.', direction: ONE_WORD_ADD },                     // + I
  { sentence: "The boy saved money so that he can buy his brother's present.", direction: ONE_WORD_FIX },     // can → could
  { sentence: 'She went to the cafe so that she can meet her dad.', direction: ONE_WORD_FIX },                // can → could
  { sentence: 'They will get together so that can they watch a movie.', direction: WORD_ORDER },              // can they → they can
  { sentence: 'I brought an umbrella in order to not get wet.', direction: WORD_ORDER },                      // to not → not to
  { sentence: 'I called the bookstore so that to place an order.', direction: USE('to부정사를'), keepAccepted: (a) => !/so that/.test(a) },
  { sentence: "I was surprised so that I couldn't say anything.", direction: USE('so ~ that 구문을') },        // 결과 구문으로 재구성
  { sentence: 'Gwen reads a lot of books so that she could be a writer.', direction: ONE_WORD_FIX },          // could → can
  { sentence: 'I should exercise every day in order to I can be healthy.', direction: USE('so that을'), keepAccepted: (a) => /so that/.test(a) },
  { sentence: 'He came early so that to take a good seat.', direction: USE('to부정사를'), keepAccepted: (a) => !/so that/.test(a) },
  { sentence: 'Make a shopping list so that spend your money wisely.', direction: '다음 문장에서 어법상 틀린 부분을 찾아 올바른 문장 전체를 고쳐 쓰시오. (단, so that 구문을 유지할 것)' }, // + you can
  { sentence: 'She made a cake so what she could give it to her boyfriend.', direction: ONE_WORD_FIX },       // what → that
  { sentence: 'I left my name card so which he could contact me.', direction: ONE_WORD_FIX },                 // which → that
];
const bySentence = new Map(RULES.map((r) => [r.sentence, r]));
type Q = { number: number; question: string; answer: string; acceptedAnswers?: string[] };

function applyRules(questions: Q[], log: string[]): number {
  let n = 0;
  for (const q of questions) {
    const lines = q.question.split('\n');
    const sentence = lines[lines.length - 1].trim();
    const rule = bySentence.get(sentence);
    // 같은 예문을 다른 유형(예: 사역동사 Step 3)에서 재사용한 경우 제외 — 지시문이 '틀린 부분 고쳐 쓰기'일 때만
    if (!rule || !/틀린 부분을 찾아/.test(lines[0])) continue;
    const prefix = (lines[0].match(/^\[Part \d+\]\s*/) ?? [''])[0];
    const newQuestion = `${prefix}${rule.direction}\n\n${sentence}`;
    let changed = false;
    if (q.question !== newQuestion) { q.question = newQuestion; changed = true; }
    if (rule.keepAccepted && q.acceptedAnswers) {
      const kept = q.acceptedAnswers.filter(rule.keepAccepted);
      if (!rule.keepAccepted(q.answer)) log.push(`  ⚠ #${q.number} 정답키가 지시문과 불일치: ${q.answer}`);
      if (kept.length !== q.acceptedAnswers.length) {
        log.push(`  #${q.number} 인정답안 제거: ${JSON.stringify(q.acceptedAnswers.filter((a) => !rule.keepAccepted!(a)))}`);
        q.acceptedAnswers = kept; changed = true;
      }
    }
    if (changed) { n++; log.push(`  #${q.number} → ${newQuestion.replace(/\n+/g, ' ⏎ ')}`); }
  }
  return n;
}

async function main() {
  const admin = createAdminClient();
  const backup: Record<string, unknown> = {};
  const { data: tmpls } = await admin.from('naesin_templates').select('id, title, questions').ilike('title', 'so that Step 1%');
  const { data: sheets } = await admin.from('naesin_problem_sheets').select('id, title, questions').limit(3000);
  const targets: { table: 'naesin_templates' | 'naesin_problem_sheets'; id: string; title: string; questions: Q[] }[] = [
    ...(tmpls ?? []).map((t) => ({ table: 'naesin_templates' as const, id: t.id, title: t.title, questions: t.questions as Q[] })),
    ...(sheets ?? [])
      .filter((s) => (s.questions as Q[] | null)?.some((q) => bySentence.has(q.question?.split('\n').pop()?.trim() ?? '') && /틀린 부분을 찾아/.test(q.question)))
      .map((s) => ({ table: 'naesin_problem_sheets' as const, id: s.id, title: s.title, questions: s.questions as Q[] })),
  ];
  const touchedSheets: string[] = [];
  for (const t of targets) {
    backup[`${t.table}_${t.id}`] = JSON.parse(JSON.stringify(t.questions));
    const log: string[] = [];
    const n = applyRules(t.questions, log);
    console.log(`\n[${t.table}] ${t.title} (${t.id.slice(0, 8)}): ${n}문항 변경`);
    if (t.table === 'naesin_templates' || targets.indexOf(t) === 1) console.log(log.join('\n'));
    else console.log(log.filter((l) => l.includes('제거') || l.includes('⚠')).join('\n'));
    if (!APPLY || n === 0) continue;
    const { error } = await admin.from(t.table).update({ questions: t.questions }).eq('id', t.id);
    if (error) throw error;
    if (t.table === 'naesin_problem_sheets') touchedSheets.push(t.id);
  }
  writeFileSync(`${process.env.BACKUP_DIR ?? '.'}/sothat-step1-directions-backup.json`, JSON.stringify(backup, null, 1));
  for (const id of touchedSheets) {
    const before = await admin.from('naesin_problem_attempts').select('id, score').eq('sheet_id', id);
    const r = await regradeSheet(id);
    const after = await admin.from('naesin_problem_attempts').select('id, score').eq('sheet_id', id);
    const bm = new Map((before.data ?? []).map((a) => [a.id, a.score]));
    const diffs = (after.data ?? []).filter((a) => bm.get(a.id) !== a.score).map((a) => `${a.id.slice(0, 8)} ${bm.get(a.id)}→${a.score}`);
    console.log(`재채점 ${id.slice(0, 8)}: 시도 ${r.total}건, 점수 변동 ${diffs.length}건 ${diffs.join(', ')}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
