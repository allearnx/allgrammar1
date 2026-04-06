import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { createAdminClient } from '@/lib/supabase/admin';

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
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(200)
    );

    return NextResponse.json(data);
  }
);
