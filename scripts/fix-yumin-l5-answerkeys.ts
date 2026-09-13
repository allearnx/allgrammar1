/**
 * 5과 정답키 2건 수정 + 재채점 (2026-09-13, 김유민 제보)
 *  - 1단계 (1/5) 1번: "After finishj g"(정답 수정 오타) → "After finishing"
 *  - 3단계 (2/4) 19번: "stay, so that explain"(콤마 누락) → "stay, explain" (20·21번과 형식 통일)
 *  실행: npx tsx --env-file=.env.local scripts/fix-yumin-l5-answerkeys.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
const FIXES = [
  { sheetId: 'd200d996-1aac-49df-974a-2fa191e3b8a2', idx: 0, from: 'After finishj g', to: 'After finishing' },
  { sheetId: '1c4bd3b2-acc8-45db-8210-a6c2b033f0e9', idx: 18, from: 'stay, so that explain', to: 'stay, explain' },
];
const YUMIN = '5ed51e32-2853-4bfc-beec-d69cda8db9c0';

async function main() {
  const admin = createAdminClient();
  const backup: Record<string, unknown> = {};
  for (const f of FIXES) {
    const { data: sh, error } = await admin.from('naesin_problem_sheets').select('id, title, questions, answer_key').eq('id', f.sheetId).single();
    if (error || !sh) throw new Error(`sheet ${f.sheetId}: ${error?.message}`);
    backup[sh.id] = { questions: sh.questions, answer_key: sh.answer_key };
    const questions = sh.questions as { number: number; answer: string }[];
    const answerKey = sh.answer_key as unknown[];
    const q = questions[f.idx];
    console.log(`${sh.title} #${q.number}: answer=${JSON.stringify(q.answer)} key=${JSON.stringify(answerKey[f.idx])}`);
    if (q.answer !== f.from || answerKey[f.idx] !== f.from) { console.log('  ⚠ 예상값과 다름 — 건너뜀'); continue; }
    q.answer = f.to; answerKey[f.idx] = f.to;
    if (!APPLY) { console.log(`  (dry) → ${JSON.stringify(f.to)}`); continue; }
    const { error: ue } = await admin.from('naesin_problem_sheets').update({ questions, answer_key: answerKey }).eq('id', sh.id);
    if (ue) throw ue;
    const r = await regradeSheet(sh.id);
    console.log(`  ✓ → ${JSON.stringify(f.to)}  재채점: 시도 ${r.total}건 중 변경 ${r.changed}건`);
  }
  writeFileSync(`${process.env.BACKUP_DIR ?? '.'}/yumin-l5-answerkeys-backup.json`, JSON.stringify(backup, null, 1));
  for (const f of FIXES) {
    const { data: atts } = await admin.from('naesin_problem_attempts').select('created_at, score, wrong_answers').eq('sheet_id', f.sheetId).eq('student_id', YUMIN).order('created_at');
    console.log(`김유민 ${f.sheetId.slice(0, 8)}:`, atts?.map((a) => `${a.created_at.slice(5, 16)} ${a.score}% 오답=${(a.wrong_answers as { number: number; retryCorrect?: boolean }[]).filter((w) => !w.retryCorrect).map((w) => w.number).join(',')}`).join(' | '));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
