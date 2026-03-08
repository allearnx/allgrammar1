import { NextRequest, NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const updateSchema = z.object({
  studentId: z.string().uuid(),
  stages: z.array(z.enum(['fill_blanks', 'ordering', 'translation', 'grammar_vocab'])).min(1).max(6),
});

// GET: Fetch student's passage stages
export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'] },
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

    const admin = createAdminClient();
    const { data } = await admin
      .from('naesin_student_settings')
      .select('passage_required_stages')
      .eq('student_id', studentId)
      .single();

    return NextResponse.json({
      stages: data?.passage_required_stages ?? ['fill_blanks', 'translation'],
    });
  }
);

// POST: Update student's passage stages
export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: updateSchema },
  async ({ body }) => {
    const { studentId, stages } = body;
    const admin = createAdminClient();

    // Try update first
    const { data: updated, error: updateError } = await admin
      .from('naesin_student_settings')
      .update({ passage_required_stages: stages })
      .eq('student_id', studentId)
      .select('id');

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // If no row existed, try to find student's textbook and create settings
    if (!updated || updated.length === 0) {
      // Check if student exists and find their academy's textbook assignment
      const { data: student } = await admin
        .from('users')
        .select('id')
        .eq('id', studentId)
        .single();

      if (!student) {
        return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
      }

      return NextResponse.json(
        { error: '학생의 교과서 설정이 없습니다. 학생이 먼저 교과서를 선택해야 합니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  }
);
