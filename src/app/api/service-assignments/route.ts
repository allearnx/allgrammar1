import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { serviceAssignmentCreateSchema, serviceAssignmentDeleteSchema, serviceAssignmentPatchSchema } from '@/lib/api/schemas';
import { checkServiceGate } from '@/lib/billing/check-plan-api';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { createAdminClient } from '@/lib/supabase/admin';
import { invalidateStudentServices } from '@/lib/cache/invalidate';

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
  { roles: ['boss', 'admin', 'teacher'], schema: serviceAssignmentCreateSchema },
  async ({ user, body, supabase }) => {
    await requireAcademyScope(user, body.studentId, supabase);
    // boss는 최고관리자이므로 서비스 게이트 우회
    if (user.role !== 'boss') {
      const serviceBlocked = await checkServiceGate(user.academy_id, [body.service]);
      if (serviceBlocked) return serviceBlocked;
    }

    // boss는 adminClient 사용 (API 라우트에서 RLS 세션 만료 문제 방지)
    const client = user.role === 'boss' ? createAdminClient() : supabase;
    const { data, error } = await client
      .from('service_assignments')
      .upsert(
        { student_id: body.studentId, service: body.service, assigned_by: user.id },
        { onConflict: 'student_id,service' }
      )
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    invalidateStudentServices(body.studentId);
    return NextResponse.json(data);
  }
);

// PATCH — boss/admin이 2회독 잠금 해제 / 학습 모드 변경 / 내신 암기 전용 설정
export const PATCH = createApiHandler(
  { roles: ['boss', 'admin', 'teacher'], schema: serviceAssignmentPatchSchema },
  async ({ user, body }) => {
    const admin = createAdminClient();

    // naesinMemorizeOnly → naesin 서비스에 업데이트
    if (body.naesinMemorizeOnly !== undefined) {
      if (body.naesinMemorizeOnly) {
        // 1) 기존 naesin 행이 있으면 UPDATE
        const { data, error: updateErr } = await admin
          .from('service_assignments')
          .update({ naesin_memorize_only: true })
          .eq('student_id', body.studentId)
          .eq('service', 'naesin')
          .select('student_id');

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

        // 2) 기존 행이 없으면 INSERT
        if (!data || data.length === 0) {
          const { error: insertErr } = await admin
            .from('service_assignments')
            .insert({
              student_id: body.studentId,
              service: 'naesin',
              assigned_by: user.id,
              source: 'manual',
              naesin_memorize_only: true,
            });
          if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 400 });
        }
      } else {
        // 암기 전용 해제:
        // - subscription 행은 플래그만 false로
        await admin
          .from('service_assignments')
          .update({ naesin_memorize_only: false })
          .eq('student_id', body.studentId)
          .eq('service', 'naesin')
          .eq('naesin_memorize_only', true)
          .neq('source', 'manual');

        // - manual memorize-only 행은 삭제
        const { error } = await admin
          .from('service_assignments')
          .delete()
          .eq('student_id', body.studentId)
          .eq('service', 'naesin')
          .eq('source', 'manual')
          .eq('naesin_memorize_only', true);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }
      invalidateStudentServices(body.studentId);
      return NextResponse.json({ success: true });
    }

    // voca 관련 업데이트
    const updates: Record<string, unknown> = {};
    if (body.round2Unlocked !== undefined) updates.round2_unlocked = body.round2Unlocked;
    if (body.vocaRoundMode !== undefined) updates.voca_round_mode = body.vocaRoundMode;

    const { error } = await admin
      .from('service_assignments')
      .update(updates)
      .eq('student_id', body.studentId)
      .eq('service', 'voca');
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    invalidateStudentServices(body.studentId);
    return NextResponse.json({ success: true });
  }
);

// DELETE — boss/admin이 서비스 배정 해제
export const DELETE = createApiHandler(
  { roles: ['boss', 'admin', 'teacher'], schema: serviceAssignmentDeleteSchema, hasBody: true },
  async ({ user, body, supabase }) => {
    await requireAcademyScope(user, body.studentId, supabase);
    const client = user.role === 'boss' ? createAdminClient() : supabase;
    const { error } = await client
      .from('service_assignments')
      .delete()
      .eq('student_id', body.studentId)
      .eq('service', body.service);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    invalidateStudentServices(body.studentId);
    return NextResponse.json({ success: true });
  }
);
