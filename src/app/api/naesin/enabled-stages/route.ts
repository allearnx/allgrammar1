import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const ALL_STAGES = ['vocab', 'passage', 'grammar', 'problem', 'lastReview'] as const;

const updateSchema = z.object({
  studentId: z.string().uuid(),
  stages: z.array(z.enum(ALL_STAGES)).min(1),
});

// GET: Fetch student's enabled_stages
export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'] },
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

    const admin = createAdminClient();
    const { data } = await admin
      .from('naesin_student_settings')
      .select('enabled_stages')
      .eq('student_id', studentId)
      .single();

    return NextResponse.json({
      stages: data?.enabled_stages ?? ALL_STAGES,
    });
  }
);

// POST: Update student's enabled_stages
export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: updateSchema },
  async ({ body }) => {
    const { studentId, stages } = body;
    const admin = createAdminClient();

    const updated = dbResult(await admin
      .from('naesin_student_settings')
      .update({ enabled_stages: stages })
      .eq('student_id', studentId)
      .select('id'));

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: '학생의 교과서 설정이 없습니다. 학생이 먼저 교과서를 선택해야 합니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  }
);
