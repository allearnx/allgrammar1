import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaBookAssignmentSchema, vocaBookAssignmentDeleteSchema } from '@/lib/api/schemas';

// POST — boss/admin이 학생에게 교재 배정 (upsert)
export const POST = createApiHandler(
  { roles: ['boss', 'admin'], schema: vocaBookAssignmentSchema },
  async ({ user, body, supabase }) => {
    const { data, error } = await supabase
      .from('voca_book_assignments')
      .upsert(
        { student_id: body.studentId, book_id: body.bookId, assigned_by: user.id },
        { onConflict: 'student_id' }
      )
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
);

// DELETE — boss/admin이 교재 배정 해제
export const DELETE = createApiHandler(
  { roles: ['boss', 'admin'], schema: vocaBookAssignmentDeleteSchema, hasBody: true },
  async ({ body, supabase }) => {
    const { error } = await supabase
      .from('voca_book_assignments')
      .delete()
      .eq('student_id', body.studentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
);
