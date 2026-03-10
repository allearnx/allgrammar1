import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { serviceAssignmentCreateSchema, serviceAssignmentDeleteSchema } from '@/lib/api/schemas';
import { createAdminClient } from '@/lib/supabase/admin';

// GET — 학생 본인의 배정 목록
export const GET = createApiHandler({ hasBody: false }, async ({ user }) => {
  const admin = createAdminClient();
  const { data } = await admin
    .from('service_assignments')
    .select('*')
    .eq('student_id', user.id);
  return NextResponse.json(data || []);
});

// POST — boss/admin이 서비스 배정
export const POST = createApiHandler(
  { roles: ['boss', 'admin'], schema: serviceAssignmentCreateSchema },
  async ({ user, body }) => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('service_assignments')
      .upsert(
        { student_id: body.studentId, service: body.service, assigned_by: user.id },
        { onConflict: 'student_id,service' }
      )
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
);

// DELETE — boss/admin이 서비스 배정 해제
export const DELETE = createApiHandler(
  { roles: ['boss', 'admin'], schema: serviceAssignmentDeleteSchema, hasBody: true },
  async ({ body }) => {
    const admin = createAdminClient();
    const { error } = await admin
      .from('service_assignments')
      .delete()
      .eq('student_id', body.studentId)
      .eq('service', body.service);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
);
