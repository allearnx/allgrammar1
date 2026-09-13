/**
 * 5과 3단계 (3/4) 형식 오답 정답처리 (2026-09-13, 선생님 지시) — 내용은 맞고 답 형식만 다른 6문항.
 *  실행: npx tsx --env-file=.env.local scripts/fix-yumin-l5-step3-format.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
const SHEET = '60a41fbc-5efb-43c5-8b88-31ed7f87fe8a';
const YUMIN = '5ed51e32-2853-4bfc-beec-d69cda8db9c0';
const ACCEPT: { number: number; expect: string; add: string[] }[] = [
  { number: 2, expect: 'so that', add: ['She studied the map so that she wouldn\'t get lost in the city.'] },
  { number: 4, expect: 'so that', add: ['The teacher wrote the instructions on the board so that every student could follow them.'] },
  { number: 5, expect: 'so that', add: ['Minjun finished his homework early so that he could watch the game.'] },
  { number: 6, expect: ', so', add: ['The store was out of stock ,so we had to order online.', 'The store was out of stock, so we had to order online.'] },
  { number: 10, expect: 'so that, could', add: ['so that I could'] },
  { number: 16, expect: 'so as not to', add: ['so that I wouldn\'t', 'so that I would not'] },
];

async function main() {
  const admin = createAdminClient();
  const { data: sh, error } = await admin.from('naesin_problem_sheets').select('id, title, questions, answer_key').eq('id', SHEET).single();
  if (error || !sh) throw new Error(error?.message);
  writeFileSync(`${process.env.BACKUP_DIR ?? '.'}/yumin-l5-step3-format-backup.json`, JSON.stringify({ questions: sh.questions, answer_key: sh.answer_key }, null, 1));
  const questions = sh.questions as { number: number; answer: string; acceptedAnswers?: string[] }[];
  for (const a of ACCEPT) {
    const q = questions.find((x) => x.number === a.number);
    if (!q || q.answer !== a.expect) { console.log(`#${a.number} ⚠ 예상값 불일치 (${q?.answer}) — 건너뜀`); continue; }
    const before = q.acceptedAnswers ?? [];
    q.acceptedAnswers = [...before, ...a.add.filter((x) => !before.includes(x))];
    console.log(`#${a.number} accepted += ${JSON.stringify(a.add)}`);
  }
  if (!APPLY) return;
  const { error: ue } = await admin.from('naesin_problem_sheets').update({ questions }).eq('id', SHEET);
  if (ue) throw ue;
  console.log('재채점', await regradeSheet(SHEET));
  const { data: atts } = await admin.from('naesin_problem_attempts').select('created_at, score, wrong_answers').eq('sheet_id', SHEET).eq('student_id', YUMIN).order('created_at');
  console.log('김유민:', atts?.map((a) => `${a.created_at.slice(5, 16)} ${a.score}% 오답=${(a.wrong_answers as { number: number }[]).map((w) => w.number).join(',')}`).join(' | '));
}
main().catch((e) => { console.error(e); process.exit(1); });
