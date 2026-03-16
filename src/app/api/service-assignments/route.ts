import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { serviceAssignmentCreateSchema, serviceAssignmentDeleteSchema, serviceAssignmentPatchSchema } from '@/lib/api/schemas';
import { checkServiceGate } from '@/lib/billing/check-plan-api';

// GET — 학생 본인의 배정 목록
export const GET = createApiHandler({ hasBody: false }, async ({ user, supabase }) => {
  const { data } = await supabase
    .from('service_assignments')
    .select('*')
    .eq('student_id', user.id);
  return NextResponse.json(data || []);
});

// POST — boss/admin이 서비스 배정
export const POST = createApiHandler(
  { roles: ['boss', 'admin'], schema: serviceAssignmentCreateSchema },
  async ({ user, body, supabase }) => {
    // Free tier: only allow assigning the selected free service
    const serviceBlocked = await checkServiceGate(user.academy_id, [body.service]);
    if (serviceBlocked) return serviceBlocked;

    const { data, error } = await supabase
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

// PATCH — boss가 2회독 잠금 해제 토글
export const PATCH = createApiHandler(
  { roles: ['boss'], schema: serviceAssignmentPatchSchema },
  async ({ body, supabase }) => {
    const { error } = await supabase
      .from('service_assignments')
      .update({ round2_unlocked: body.round2Unlocked })
      .eq('student_id', body.studentId)
      .eq('service', 'voca');
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
);

// DELETE — boss/admin이 서비스 배정 해제
export const DELETE = createApiHandler(
  { roles: ['boss', 'admin'], schema: serviceAssignmentDeleteSchema, hasBody: true },
  async ({ body, supabase }) => {
    const { error } = await supabase
      .from('service_assignments')
      .delete()
      .eq('student_id', body.studentId)
      .eq('service', body.service);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
);
