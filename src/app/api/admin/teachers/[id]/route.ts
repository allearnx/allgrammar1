import { NextResponse } from 'next/server';
import { createApiHandler, NotFoundError, ForbiddenError } from '@/lib/api';
import { teacherPatchSchema } from '@/lib/api/schemas';

export const PATCH = createApiHandler(
  { roles: ['admin', 'boss'], schema: teacherPatchSchema },
  async ({ user, body, params, supabase }) => {
    // Only update teachers in same academy
    const { data: teacher } = await supabase
      .from('users')
      .select('academy_id')
      .eq('id', params.id)
      .eq('role', 'teacher')
      .single();

    if (!teacher) throw new NotFoundError('선생님을 찾을 수 없습니다.');

    if (user.role !== 'boss' && teacher.academy_id !== user.academy_id) {
      throw new ForbiddenError();
    }

    const { error } = await supabase
      .from('users')
      .update({ is_active: body.is_active })
      .eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
