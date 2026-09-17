/**
 * 내신 콕콕 세트를 학생에게 배정 (API /api/naesin/clinics/assign 과 동일 로직, 운영용 스크립트).
 *   npx tsx --env-file=.env.local scripts/assign-kokkok-to-student.ts --template <id> --student <id> --note "..." [--apply]
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeQuestions, validateBeforeSave } from '@/lib/validation/problem-validator';
import { sendTelegram } from '@/lib/telegram';

const arg = (k: string) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : undefined; };
const APPLY = process.argv.includes('--apply');
const TEMPLATE = arg('--template')!; const STUDENT = arg('--student')!; const NOTE = arg('--note') ?? null; const BY = arg('--by') ?? null;

async function main() {
  const admin = createAdminClient();
  const [{ data: t }, { data: s }] = await Promise.all([
    admin.from('naesin_templates').select('*').eq('id', TEMPLATE).single(),
    admin.from('users').select('id, full_name').eq('id', STUDENT).single(),
  ]);
  if (!t || !s) throw new Error('템플릿/학생 없음');
  const { data: existing } = await admin.from('naesin_problem_sheets').select('id').eq('source_template_id', TEMPLATE).eq('assigned_student_id', STUDENT);
  const { questions, answerKey } = sanitizeQuestions(t.questions, t.answer_key, { title: t.title });
  const v = validateBeforeSave(questions); if (!v.valid) throw new Error('검증 실패 ' + JSON.stringify(v.errors));
  console.log(`"${t.title}" (${questions.length}문항) → ${s.full_name} | 기존 배정 ${existing?.length ?? 0}건 | 메모: ${NOTE}`);
  if (!APPLY) { console.log('[dry-run]'); return; }
  const { data: sheet, error } = await admin.from('naesin_problem_sheets').insert({
    unit_id: null, assigned_student_id: STUDENT, assigned_by: BY, assigned_at: new Date().toISOString(), assigned_note: NOTE,
    title: t.title, mode: t.mode, questions, answer_key: answerKey, category: t.category || 'problem', video_url: t.video_url ?? null, source_template_id: TEMPLATE,
  }).select('id').single();
  if (error) throw error;
  console.log('✓ 배정 완료 sheet', sheet.id);
  await sendTelegram(`[내신 콕콕 배정] ${s.full_name} ← "${t.title}" (${questions.length}문항)\n사유: ${NOTE}\n학생 화면: 내신 홈 → 내신 콕콕. 콘텐츠 관리 → Lv.27 → 관계부사에서 진행·점수 확인.`);
  console.log('✓ 텔레그램 알림 발송');
}
main().catch((e) => { console.error(e); process.exit(1); });
