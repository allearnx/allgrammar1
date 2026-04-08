import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, dbResult } from '@/lib/api';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { createAdminClient } from '@/lib/supabase/admin';
import { enrichWrongAnswersFromSheet } from '@/lib/naesin/enrich-wrong-answers';

/**
 * naesin_problem_attempts에는 있지만 naesin_wrong_answers에 없는
 * 문제풀이 오답을 자동으로 복구한다 (학생 1명 대상).
 */
async function autoBackfillForStudent(
  admin: ReturnType<typeof createAdminClient>,
  studentId: string,
) {
  // 1. 이 학생의 오답이 있는 attempts 조회
  const { data: attempts } = await admin
    .from('naesin_problem_attempts')
    .select('id, sheet_id, wrong_answers')
    .eq('student_id', studentId)
    .not('wrong_answers', 'eq', '[]');

  if (!attempts || attempts.length === 0) return 0;

  // 2. 이미 naesin_wrong_answers에 있는 sheet_id 집합
  const { data: existing } = await admin
    .from('naesin_wrong_answers')
    .select('sheet_id')
    .eq('student_id', studentId)
    .eq('stage', 'problem')
    .not('sheet_id', 'is', null);

  const existingSet = new Set((existing || []).map((e) => e.sheet_id));

  // 3. 누락된 attempts 필터
  const missing = attempts.filter((a) => !existingSet.has(a.sheet_id));
  if (missing.length === 0) return 0;

  // 4. sheet 정보 조회
  const sheetIds = [...new Set(missing.map((a) => a.sheet_id))];
  const { data: sheets } = await admin
    .from('naesin_problem_sheets')
    .select('id, unit_id, mode, questions')
    .in('id', sheetIds);

  const sheetMap = new Map((sheets || []).map((s) => [s.id, s]));

  // 5. 누락 오답 레코드 생성
  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  for (const attempt of missing) {
    // 같은 시트의 중복 attempt 방지 (최신 1개만)
    if (seen.has(attempt.sheet_id)) continue;
    seen.add(attempt.sheet_id);

    const sheet = sheetMap.get(attempt.sheet_id);
    if (!sheet) continue;

    const wrongAnswers = attempt.wrong_answers as {
      number: number;
      userAnswer: string | number;
      correctAnswer: string | number;
      question?: string;
    }[];
    if (!wrongAnswers || wrongAnswers.length === 0) continue;

    const questions = (sheet.questions || []) as {
      options?: string[];
      explanation?: string;
    }[];

    for (const wa of wrongAnswers) {
      const idx = wa.number - 1;
      const q = questions[idx];
      rows.push({
        student_id: studentId,
        unit_id: sheet.unit_id,
        stage: 'problem',
        source_type: sheet.mode || 'interactive',
        question_data: {
          ...wa,
          ...(q?.options ? { options: q.options } : {}),
          ...(q?.explanation ? { explanation: q.explanation } : {}),
        },
        sheet_id: attempt.sheet_id,
      });
    }
  }

  if (rows.length === 0) return 0;

  // 6. 배치 insert
  for (let i = 0; i < rows.length; i += 500) {
    await admin.from('naesin_wrong_answers').insert(rows.slice(i, i + 500));
  }

  return rows.length;
}

export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'] },
  async ({ user, supabase, request }) => {
    const studentId = request.nextUrl.searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    await requireAcademyScope(user, studentId, supabase);

    // Staff uses admin client to bypass RLS (boss has no academy_id)
    const admin = createAdminClient();

    // 누락된 문제풀이 오답 자동 복구
    await autoBackfillForStudent(admin, studentId);

    const data = dbResult(
      await admin
        .from('naesin_wrong_answers')
        .select('*, sheet:naesin_problem_sheets(id, title, questions), unit:naesin_units(id, unit_number, title)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
    );

    enrichWrongAnswersFromSheet(data as Record<string, unknown>[]);

    return NextResponse.json(data);
  }
);

// 선생님/원장이 학생의 오답을 정답처리 (resolved=true)
const resolveSchema = z.object({
  wrongAnswerId: z.string().uuid(),
  studentId: z.string().uuid(),
});

export const PATCH = createApiHandler(
  { schema: resolveSchema, roles: ['teacher', 'admin', 'boss'] },
  async ({ user, body, supabase }) => {
    const { wrongAnswerId, studentId } = body;

    await requireAcademyScope(user, studentId, supabase);

    const admin = createAdminClient();

    dbResult(
      await admin
        .from('naesin_wrong_answers')
        .update({ resolved: true })
        .eq('id', wrongAnswerId)
        .eq('student_id', studentId)
    );

    return NextResponse.json({ success: true });
  }
);
