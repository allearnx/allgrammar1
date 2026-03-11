import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { examAssignmentUpsertSchema, examAssignmentDeleteSchema } from '@/lib/api/schemas';

export const GET = createApiHandler(
  {},
  async ({ user, supabase, request }) => {
    const studentId = request.nextUrl.searchParams.get('studentId');
    const textbookId = request.nextUrl.searchParams.get('textbookId');

    if (!studentId || !textbookId) {
      return NextResponse.json({ error: 'Missing studentId or textbookId' }, { status: 400 });
    }

    // Students can only read their own assignments
    if (user.role === 'student' && user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = dbResult(await supabase
      .from('naesin_exam_assignments')
      .select('*')
      .eq('student_id', studentId)
      .eq('textbook_id', textbookId)
      .order('exam_round'));
    return NextResponse.json({ assignments: data || [] });
  }
);

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: examAssignmentUpsertSchema },
  async ({ body, supabase }) => {
    const { studentId, textbookId, examRound, examLabel, examDate, unitIds } = body;

    const data = dbResult(await supabase
      .from('naesin_exam_assignments')
      .upsert(
        {
          student_id: studentId,
          textbook_id: textbookId,
          exam_round: examRound,
          exam_label: examLabel || null,
          exam_date: examDate || null,
          unit_ids: unitIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,textbook_id,exam_round' }
      )
      .select()
      .single());
    return NextResponse.json({ assignment: data });
  }
);

export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: examAssignmentDeleteSchema, hasBody: true },
  async ({ body, supabase }) => {
    const { studentId, textbookId, examRound } = body;

    dbResult(await supabase
      .from('naesin_exam_assignments')
      .delete()
      .eq('student_id', studentId)
      .eq('textbook_id', textbookId)
      .eq('exam_round', examRound));
    return NextResponse.json({ success: true });
  }
);
