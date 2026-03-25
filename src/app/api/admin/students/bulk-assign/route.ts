import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { studentBulkAssignSchema } from '@/lib/api/schemas';
import { checkPlanGate, checkServiceGate } from '@/lib/billing/check-plan-api';

export const POST = createApiHandler(
  { roles: ['admin', 'boss'], schema: studentBulkAssignSchema, rateLimit: { max: 20, windowMs: 60_000 } },
  async ({ user, body }) => {
    // Boss는 플랜 제한 없이 배정 가능
    if (user.role !== 'boss') {
      const blocked = await checkPlanGate(user.academy_id, 'bulk:assign');
      if (blocked) return blocked;

      if (body.action === 'assign') {
        const serviceBlocked = await checkServiceGate(user.academy_id, body.services);
        if (serviceBlocked) return serviceBlocked;
      }
    }

    const admin = createAdminClient();

    // Verify all students belong to admin's academy
    if (user.role === 'admin') {
      if (!user.academy_id) {
        return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
      }
      const { data: students } = await admin
        .from('users')
        .select('id')
        .in('id', body.studentIds)
        .eq('academy_id', user.academy_id);

      if (!students || students.length !== body.studentIds.length) {
        return NextResponse.json(
          { error: '일부 학생이 소속 학원에 없습니다.' },
          { status: 403 }
        );
      }
    }

    if (body.action === 'assign') {
      // Batch upsert all combinations
      const rows = body.studentIds.flatMap((studentId) =>
        body.services.map((service) => ({
          student_id: studentId,
          service,
          assigned_by: user.id,
          source: 'manual' as const,
        }))
      );

      const { error } = await admin
        .from('service_assignments')
        .upsert(rows, { onConflict: 'student_id,service' });

      if (error) {
        return NextResponse.json({ error: '서비스 배정 실패' }, { status: 500 });
      }

      return NextResponse.json({ success: true, affected: rows.length });
    } else {
      // Batch delete by matching student_id IN (...) AND service IN (...)
      const { count } = await admin
        .from('service_assignments')
        .delete({ count: 'exact' })
        .in('student_id', body.studentIds)
        .in('service', body.services)
        .eq('source', 'manual');

      return NextResponse.json({ success: true, affected: count || 0 });
    }
  }
);
