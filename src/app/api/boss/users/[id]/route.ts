import { NextResponse } from 'next/server';
import { createApiHandler, dbResult, NotFoundError, ValidationError, ForbiddenError } from '@/lib/api';
import { auditLog } from '@/lib/api/audit';
import { userPatchSchema } from '@/lib/api/schemas';
import { createAdminClient } from '@/lib/supabase/admin';
import { invalidateStudentServices } from '@/lib/cache/invalidate';

export const PATCH = createApiHandler(
  { roles: ['boss'], schema: userPatchSchema },
  async ({ user, body, params, supabase }) => {
    const updates: Record<string, unknown> = {};

    if ('role' in body && body.role !== undefined) {
      updates.role = body.role;
    }

    if ('academy_id' in body) {
      if (body.academy_id !== null && body.academy_id !== undefined) {
        const { data: academy } = await supabase
          .from('academies')
          .select('id')
          .eq('id', body.academy_id)
          .single();

        if (!academy) throw new NotFoundError('학원을 찾을 수 없습니다.');
      }
      updates.academy_id = body.academy_id;
    }

    if ('is_active' in body && body.is_active !== undefined) {
      updates.is_active = body.is_active;
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('수정할 항목이 없습니다.');
    }

    dbResult(await supabase
      .from('users')
      .update(updates)
      .eq('id', params.id));

    // 무소속(academy_id=null) 전환 시 학원 플랜으로 받았던 서비스 배정 정리.
    // 학원 소속이면 서비스가 source='subscription'(학원 유료 플랜 기준)으로 배정되는데,
    // 무소속이 되면 getPlanContext가 이를 유료로 오인한다(무료 계정이 유료처럼 열림).
    // → 본인 개인 구독/결제가 전혀 없을 때만, 학원에서 받은 subscription 배정을 삭제한다.
    //   (개인 결제/구독자는 그대로 유지 — 접근을 잘못 끊지 않는 쪽으로 안전하게)
    let clearedServices = 0;
    const movingToNoAcademy =
      'academy_id' in body && (body.academy_id === null || body.academy_id === undefined);
    if (movingToNoAcademy) {
      const admin = createAdminClient();
      const [{ count: subCount }, { count: paidOrderCount }] = await Promise.all([
        admin
          .from('subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', params.id)
          .in('status', ['trialing', 'active', 'past_due']),
        admin
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', params.id)
          .eq('status', 'paid'),
      ]);
      if ((subCount ?? 0) === 0 && (paidOrderCount ?? 0) === 0) {
        const { data: removed } = await admin
          .from('service_assignments')
          .delete()
          .eq('student_id', params.id)
          .eq('source', 'subscription')
          .select('id');
        clearedServices = removed?.length ?? 0;
      }
      // 학원/서비스가 바뀌었으니 캐시된 plan context·서비스 목록을 즉시 갱신
      invalidateStudentServices(params.id);
    }

    await auditLog(supabase, user.id, 'user.role_change', {
      type: 'user', id: params.id, details: { ...updates, clearedServices },
    });

    return NextResponse.json({ success: true, clearedServices });
  }
);

export const DELETE = createApiHandler(
  { roles: ['boss'] },
  async ({ user, params, supabase }) => {
    const targetId = params.id;

    // boss 자신은 삭제 불가
    if (targetId === user.id) {
      return NextResponse.json(
        { error: '자기 자신은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 대상 사용자 확인 + 학원 소속 검증
    const { data: target } = await supabase
      .from('users')
      .select('id, role, email, academy_id')
      .eq('id', targetId)
      .single();

    if (!target) throw new NotFoundError('사용자를 찾을 수 없습니다.');

    if (target.academy_id && user.academy_id && target.academy_id !== user.academy_id) {
      throw new ForbiddenError('다른 학원 사용자는 삭제할 수 없습니다.');
    }

    const adminClient = createAdminClient();

    // 원장이 소유한 학원 처리 (academies.owner_id → users FK 때문에 안 풀면 삭제가 막힘).
    // 소속 회원(원장 본인 제외)이 있으면 차단, 빈 학원이면 구독·학원까지 함께 정리한다.
    // (빈 학원 = 원장만 멤버 · 학생 0 → 잃을 데이터 없음. 데드락 해소)
    const { data: ownedAcademies } = await adminClient
      .from('academies')
      .select('id, name')
      .eq('owner_id', targetId);

    for (const acad of ownedAcademies ?? []) {
      const { count: otherMembers } = await adminClient
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', acad.id)
        .neq('id', targetId);
      if ((otherMembers ?? 0) > 0) {
        throw new ValidationError(
          `이 사용자는 학원 '${acad.name}'의 원장입니다. 소속 회원 ${otherMembers}명이 있어 삭제할 수 없습니다. 먼저 회원을 다른 학원으로 이동하거나 원장을 이관하세요.`,
        );
      }
    }

    // 빈 학원 정리 — 삭제 순서: 구독 → 회원 academy_id 해제 → 학원 (FK 역순)
    let removedAcademies = 0;
    for (const acad of ownedAcademies ?? []) {
      await adminClient.from('subscriptions').delete().eq('academy_id', acad.id);
      await adminClient.from('users').update({ academy_id: null }).eq('academy_id', acad.id);
      dbResult(await adminClient.from('academies').delete().eq('id', acad.id));
      removedAcademies++;
    }

    // users 테이블에서 삭제
    dbResult(await supabase.from('users').delete().eq('id', targetId));

    // Supabase Auth에서도 삭제
    await adminClient.auth.admin.deleteUser(targetId);

    await auditLog(supabase, user.id, 'user.delete', {
      type: 'user', id: targetId, details: { email: target.email, role: target.role, removedAcademies },
    });

    return NextResponse.json({ success: true, removedAcademies });
  }
);
