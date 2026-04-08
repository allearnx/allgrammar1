import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, dbResult } from '@/lib/api';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { createAdminClient } from '@/lib/supabase/admin';
import { enrichWrongAnswersFromSheet } from '@/lib/naesin/enrich-wrong-answers';

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

    const data = dbResult(
      await admin
        .from('naesin_wrong_answers')
        .select('*, sheet:naesin_problem_sheets(id, title, questions)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(200)
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
