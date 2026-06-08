import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, dbResult } from '@/lib/api';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { createAdminClient } from '@/lib/supabase/admin';

// NOTE: autoBackfill 제거 — submit/route.ts에서 오답 저장이 실시간으로 처리됨.
// getDraftWrongAnswers 제거 — 드래프트 오답은 includeDrafts=true 시에만 로드.

const WRONG_ANSWER_COLUMNS = 'id, student_id, unit_id, stage, source_type, question_data, resolved, sheet_id, created_at, round';

export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'] },
  async ({ user, supabase, request }) => {
    const studentId = request.nextUrl.searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    await requireAcademyScope(user, studentId, supabase);

    const admin = createAdminClient();

    const data = dbResult(
      await admin
        .from('naesin_wrong_answers')
        .select(`${WRONG_ANSWER_COLUMNS}, sheet:naesin_problem_sheets(id, title), unit:naesin_units(id, unit_number, title)`)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(300)
    );

    return NextResponse.json(data || []);
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
