/**
 * 중1 YBM박 5과 문법 시트 15개 — 풀 수 없는 문항 정비 (2026-09-13, 박윤지 제보)
 *  - "보기와 같이 문장을 전환하시오"인데 보기(예시)가 없음 18문항 → ＜보기＞ 예시 문장 삽입 + 비교급 명시
 *  - 영어 지시문 17문항 → 한국어
 *  - 2단계 (5/6) 10번: "밑줄 친 부분" 문항인데 보기에 밑줄 없음 → <u> 복원
 *  - 1단계 (1/5) 19번 관사 누락, 1단계 (3/5) 5번 빈칸 누락
 *  실행: npx tsx --env-file=.env.local scripts/fix-ybm1-l5-directions.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
const ANCHOR_SHEET = '28371bb4'; // 5과 문법 1단계 (3/5) — 같은 unit의 시트 전부 대상
type Q = { number: number; question: string; answer: string; options?: string[]; acceptedAnswers?: string[] };
const addAcc = (q: Q, list: string[]) => { q.acceptedAnswers = [...(q.acceptedAnswers ?? []), ...list.filter((a) => !(q.acceptedAnswers ?? []).includes(a))]; };

const EXAMPLE = '＜보기＞ Gold isn\'t as hard as iron. → Iron is harder than gold.';
const KO: [RegExp, string][] = [
  [/^Choose the correct one:\s*/, '다음 괄호 안에서 알맞은 것을 고르시오: '],
  [/^Complete the sentences? using a little \/ much \+ a comparative:\s*/, 'a little 또는 much + 비교급을 사용하여 문장을 완성하시오: '],
  [/^Complete the sentences? using a comparative:\s*/, '비교급을 사용하여 문장을 완성하시오: '],
  [/^Fill in the blanks with the correct comparative form of the adjectives in parentheses:\s*/, '괄호 안 형용사의 알맞은 비교급 형태로 빈칸을 채우시오: '],
  [/^Rewrite the sentence with a comparative:\s*/, '비교급을 사용한 문장으로 다시 쓰시오. '],
  [/^Which one is grammatically right\?/, '다음 중 어법상 올바른 것은?'],
  [/^According to the text, how many books does Mina have\?/, '다음 글을 읽고, Mina가 가진 책의 수로 알맞은 것을 고르시오.'],
];
// 대명사·철자 변형이 자연스러운 전환 문항의 인정답안
const ACC: [string, string[]][] = [
  ['I don\'t get up as early as you.', ['You get up earlier than me.', 'You get up earlier than I.']],
  ['My school is not as far as yours.', ['Your school is further than mine.']],
  ['In summer, a fan isn\'t as cool as an air conditioner.', ['In summer, an air conditioner is cooler than a fan.']],
];

function fixQuestion(q: Q, sheetTitle: string, log: string[]) {
  const before = q.question;
  // 1) 보기 없는 전환 문항
  const m = q.question.match(/^보기와 같이 문장을 전환하시오[.:]\s*(.+?)\s*(※ 완전한 문장으로 쓰시오\.?)?\s*$/s);
  if (m) {
    q.question = `＜보기＞와 같이 비교급을 사용하여 문장을 바꿔 쓰시오.\n${EXAMPLE}\n\n${m[1].trim()} ※ 완전한 문장으로 쓰시오.`;
    for (const [sent, acc] of ACC) if (m[1].includes(sent)) addAcc(q, acc);
  }
  // 2) 영어 지시문
  for (const [re, ko] of KO) if (re.test(q.question)) q.question = q.question.replace(re, ko);
  // 3) 개별 문항
  if (sheetTitle.includes('1단계 (1/5)') && q.question.includes('Who is (good / better) singer : Mina or Jina?')) {
    q.question = q.question.replace('Who is (good / better) singer : Mina or Jina?', 'Who is a (good / better) singer, Mina or Jina?');
  }
  if (sheetTitle.includes('1단계 (3/5)') && q.question.includes('Today the wind is very strong. Yesterday it was calm. (windy)') && !q.question.includes('____')) {
    q.question = q.question.trimEnd() + '\n→ Today it\'s __________.';
    q.answer = 'much windier than yesterday';
  }
  if (sheetTitle.includes('2단계 (5/6)') && q.options && q.options[0] === 'David looks sadly.') {
    q.options = q.options.map((o) => o.replace(/^(\S+ \S+ )(\S+)\.$/, '$1<u>$2</u>.'));
  }
  if (q.question !== before || (q.options ?? []).some((o) => o.includes('<u>') && sheetTitle.includes('2단계 (5/6)') && q.number === 10)) {
    log.push(`  #${q.number} ${q.question.split('\n')[0].slice(0, 60)}${q.question !== before ? '' : ' [옵션 밑줄]'}`);
  }
}

async function main() {
  const admin = createAdminClient();
  const { data: all } = await admin.from('naesin_problem_sheets').select('id, title, unit_id, questions, answer_key').limit(3000);
  const unitId = all!.find((s) => s.id.startsWith(ANCHOR_SHEET))!.unit_id;
  const sheets = all!.filter((s) => s.unit_id === unitId).sort((a, b) => a.title.localeCompare(b.title));
  const backup: Record<string, unknown> = {};
  const touched: string[] = [];
  let total = 0;
  for (const s of sheets) {
    const qs = s.questions as Q[];
    const answerKey = s.answer_key as unknown[];
    const log: string[] = [];
    qs.forEach((q, i) => { const a0 = q.answer; fixQuestion(q, s.title, log); if (q.answer !== a0) answerKey[i] = q.answer; });
    if (!log.length) continue;
    total += log.length;
    backup[s.id] = JSON.parse(JSON.stringify({ questions: s.questions, answer_key: s.answer_key }));
    console.log(`\n[${s.title}] ${log.length}건\n${log.join('\n')}`);
    if (!APPLY) continue;
    const { error } = await admin.from('naesin_problem_sheets').update({ questions: qs, answer_key: answerKey }).eq('id', s.id);
    if (error) throw error;
    touched.push(s.id);
  }
  console.log(`\n총 ${total}문항`);
  writeFileSync(`${process.env.BACKUP_DIR ?? '.'}/ybm1-l5-directions-backup.json`, JSON.stringify(backup, null, 1));
  if (!APPLY) return;
  // 잔여 검사: 영어 지시문·보기 없는 전환 문항이 남았는지
  const { data: after } = await admin.from('naesin_problem_sheets').select('title, questions').eq('unit_id', unitId);
  const left = (after ?? []).flatMap((s) => (s.questions as Q[]).filter((q) => (!/[가-힣]/.test(q.question.split('\n')[0]) && !q.question.startsWith('[보기]')) || (/보기와 같이/.test(q.question) && !/＜보기＞/.test(q.question))).map((q) => `${s.title} #${q.number}`));
  console.log('잔여:', left.length ? left.join(', ') : '없음');
  for (const id of touched) {
    const before = await admin.from('naesin_problem_attempts').select('id, score').eq('sheet_id', id);
    if (!before.data?.length) continue;
    const r = await regradeSheet(id);
    const afterA = await admin.from('naesin_problem_attempts').select('id, score').eq('sheet_id', id);
    const bm = new Map(before.data.map((a) => [a.id, a.score]));
    const diffs = (afterA.data ?? []).filter((a) => bm.get(a.id) !== a.score).map((a) => `${a.id.slice(0, 8)} ${bm.get(a.id)}→${a.score}`);
    console.log(`재채점 ${id.slice(0, 8)}: 시도 ${r.total}건, 점수 변동 ${diffs.length}건 ${diffs.join(', ')}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
