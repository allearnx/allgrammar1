import { NextRequest, NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { z } from 'zod';

const updateSchema = z.object({
  studentId: z.string().uuid(),
  stages: z.array(z.enum(['fill_blanks', 'ordering', 'translation', 'grammar_vocab'])).min(1).max(6),
});

// GET: Fetch student's passage stages
export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'] },
  async ({ supabase, request }) => {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

    const { data } = await supabase
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
  async ({ body, supabase }) => {
    const { studentId, stages } = body;

    const { error } = await supabase
      .from('naesin_student_settings')
      .update({ passage_required_stages: stages })
      .eq('student_id', studentId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
