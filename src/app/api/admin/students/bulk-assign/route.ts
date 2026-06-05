import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { studentBulkAssignSchema } from '@/lib/api/schemas';
import { checkPlanGate, checkServiceGate } from '@/lib/billing/check-plan-api';

export const POST = createApiHandler(
  { roles: ['admin', 'boss'], schema: studentBulkAssignSchema, rateLimit: { max: 20, windowMs: 60_000 } },
  async ({ user, body }) => {
    // 벌크 기능은 유료 전용 (boss 제외)
    if (user.role !== 'boss') {
      const blocked = await checkPlanGate(user.academy_id, 'bulk:assign');
      if (blocked) return blocked;
    }

    // 서비스 제한은 모든 역할에 적용 (무료 플랜: 1개 서비스만)
    // naesinMemorizeOnly 할당은 서비스 게이트 우회 (보스/관리자가 명시적으로 할당)
    if (body.action === 'assign' && !body.naesinMemorizeOnly) {
      const serviceBlocked = await checkServiceGate(user.academy_id, body.services);
      if (serviceBlocked) return serviceBlocked;
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

    // ── 내신 암기 전용 할당 ──
    if (body.action === 'assign' && body.naesinMemorizeOnly) {
      // 1) 기존 naesin 행 UPDATE (subscription 포함)
      const { error: updateErr } = await admin
        .from('service_assignments')
        .update({ naesin_memorize_only: true })
        .in('student_id', body.studentIds)
        .eq('service', 'naesin');

      if (updateErr) {
        return NextResponse.json({ error: '내신 암기 업데이트 실패' }, { status: 500 });
      }

      // 2) naesin 행이 없는 학생에게 INSERT (ignoreDuplicates로 기존 행 건너뜀)
      const rows = body.studentIds.map((studentId) => ({
        student_id: studentId,
        service: 'naesin' as const,
        assigned_by: user.id,
        source: 'manual' as const,
        naesin_memorize_only: true,
      }));

      await admin
        .from('service_assignments')
        .upsert(rows, { onConflict: 'student_id,service', ignoreDuplicates: true });

      return NextResponse.json({ success: true, affected: body.studentIds.length });
    }

    // ── 내신 암기 전용 해제 ──
    if (body.action === 'revoke' && body.naesinMemorizeOnly) {
      // subscription 행: 플래그만 false
      await admin
        .from('service_assignments')
        .update({ naesin_memorize_only: false })
        .in('student_id', body.studentIds)
        .eq('service', 'naesin')
        .eq('naesin_memorize_only', true)
        .neq('source', 'manual');

      // manual memorize-only 행: 삭제
      const { count } = await admin
        .from('service_assignments')
        .delete({ count: 'exact' })
        .in('student_id', body.studentIds)
        .eq('service', 'naesin')
        .eq('source', 'manual')
        .eq('naesin_memorize_only', true);

      return NextResponse.json({ success: true, affected: count || 0 });
    }

    // ── 일반 서비스 배정 ──
    if (body.action === 'assign') {
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
      // boss는 source에 관계없이 삭제 가능, admin은 manual만
      const q = admin
        .from('service_assignments')
        .delete({ count: 'exact' })
        .in('student_id', body.studentIds)
        .in('service', body.services);

      if (user.role !== 'boss') {
        q.eq('source', 'manual');
      }

      const { count } = await q;

      return NextResponse.json({ success: true, affected: count || 0 });
    }
  }
);
