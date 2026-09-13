/**
 * 5과 3단계 can/could 정리 (2026-09-13, 선생님 지시)
 *  - 3단계 (4/4) 2번: 현재형(is running) → 키 "so that she can catch" (could는 인정답안에 유지)
 *  - 3단계 (4/4) 9번: 현재형(am preparing) → 키 "so that, can enter"
 *  - 3단계 (3/4) 11번: "so that she can" 정답처리(인정답안 추가) — 빈칸 사이 주어까지 쓴 답
 *  실행: npx tsx --env-file=.env.local scripts/fix-yumin-l5-can-could.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
type Fix = { sheetId: string; idx: number; expectAnswer: string; newAnswer?: string; addAccepted?: string[]; newExplanation?: string };
const FIXES: Fix[] = [
  { sheetId: '1a6a39e3-975f-4ac7-8c76-47ae333ea379', idx: 1, expectAnswer: 'so that she could catch', newAnswer: 'so that she can catch',
    newExplanation: '주절이 현재형(is running)이므로 so that she can catch. (could도 인정)' },
  { sheetId: '1a6a39e3-975f-4ac7-8c76-47ae333ea379', idx: 8, expectAnswer: 'so that, could enter', newAnswer: 'so that, can enter',
    newExplanation: '주절이 현재형(am preparing)이므로 so that + 주어 + can + 동사원형. (could도 인정)' },
  { sheetId: '60a41fbc-5efb-43c5-8b88-31ed7f87fe8a', idx: 10, expectAnswer: 'so that, can', addAccepted: ['so that she can'] },
];
const YUMIN = '5ed51e32-2853-4bfc-beec-d69cda8db9c0';

async function main() {
  const admin = createAdminClient();
  const backup: Record<string, unknown> = {};
  const touched = new Set<string>();
  for (const f of FIXES) {
    const { data: sh, error } = await admin.from('naesin_problem_sheets').select('id, title, questions, answer_key').eq('id', f.sheetId).single();
    if (error || !sh) throw new Error(`sheet ${f.sheetId}: ${error?.message}`);
    backup[`${sh.id}_${f.idx}`] ??= { questions: sh.questions, answer_key: sh.answer_key };
    const questions = sh.questions as { number: number; answer: string; acceptedAnswers?: string[]; explanation?: string }[];
    const answerKey = sh.answer_key as unknown[];
    const q = questions[f.idx];
    console.log(`${sh.title} #${q.number}: answer=${JSON.stringify(q.answer)} key=${JSON.stringify(answerKey[f.idx])}`);
    if (q.answer !== f.expectAnswer || answerKey[f.idx] !== f.expectAnswer) { console.log('  ⚠ 예상값과 다름 — 건너뜀'); continue; }
    if (f.newAnswer) {
      const acc = q.acceptedAnswers ?? [];
      if (!acc.includes(q.answer)) acc.push(q.answer); // 기존 could 답 인정 유지
      q.acceptedAnswers = acc;
      q.answer = f.newAnswer; answerKey[f.idx] = f.newAnswer;
      if (f.newExplanation) q.explanation = f.newExplanation;
      console.log(`  → answer ${JSON.stringify(f.newAnswer)}`);
    }
    if (f.addAccepted) {
      q.acceptedAnswers = [...(q.acceptedAnswers ?? []), ...f.addAccepted.filter((a) => !(q.acceptedAnswers ?? []).includes(a))];
      console.log(`  → accepted += ${JSON.stringify(f.addAccepted)}`);
    }
    if (!APPLY) continue;
    const { error: ue } = await admin.from('naesin_problem_sheets').update({ questions, answer_key: answerKey }).eq('id', sh.id);
    if (ue) throw ue;
    touched.add(sh.id);
  }
  writeFileSync(`${process.env.BACKUP_DIR ?? '.'}/yumin-l5-can-could-backup.json`, JSON.stringify(backup, null, 1));
  for (const id of touched) {
    const r = await regradeSheet(id);
    console.log(`재채점 ${id.slice(0, 8)}: 시도 ${r.total}건 중 변경 ${r.changed}건`);
  }
  for (const id of new Set(FIXES.map((f) => f.sheetId))) {
    const { data: atts } = await admin.from('naesin_problem_attempts').select('created_at, score, wrong_answers').eq('sheet_id', id).eq('student_id', YUMIN).order('created_at');
    console.log(`김유민 ${id.slice(0, 8)}:`, atts?.map((a) => `${a.created_at.slice(5, 16)} ${a.score}% 오답=${(a.wrong_answers as { number: number; retryCorrect?: boolean }[]).filter((w) => !w.retryCorrect).map((w) => w.number).join(',')}`).join(' | '));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
