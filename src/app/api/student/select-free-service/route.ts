import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';
import { invalidateStudentServices } from '@/lib/cache/invalidate';

const selectFreeServiceSchema = z.object({
  service: z.enum(['voca', 'naesin']),
});

export const POST = createApiHandler(
  { roles: ['student'], schema: selectFreeServiceSchema },
  async ({ user, body, supabase }) => {
    // 학원 소속이면 free tier인지 확인
    if (user.academy_id) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('academy_id', user.academy_id)
        .in('status', ['trialing', 'active', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sub?.tier !== 'free') {
        return NextResponse.json(
          { error: '유료 학원 학생은 이 기능을 사용할 수 없습니다.' },
          { status: 403 },
        );
      }
    }

    // 쓰기는 admin client — 학생 본인 INSERT RLS 정책(037)은 118에서 제거됨.
    // 위 검사를 통과한 경우에만, 본인 행·만료 없는 무료(manual) 배정만 만든다.
    const admin = createAdminClient();

    // 기존 무료 서비스 확인 (subscription 소스는 건드리지 않음)
    const { data: existing } = await admin
      .from('service_assignments')
      .select('id, service, source, assigned_by, expires_at')
      .eq('student_id', user.id)
      .is('subscription_id', null);

    // 이미 같은 서비스면 무시
    if (existing?.some((a) => a.service === body.service)) {
      return NextResponse.json({ success: true });
    }

    // 기존 무료 서비스가 있으면 전환 (삭제 후 삽입).
    // 학생이 직접 고른 무료 배정만 지운다 — 결제(payment)·선생님 배정·만료일 있는 행은 유지.
    const freeIds = (existing ?? [])
      .filter((a) => a.source === 'manual' && a.assigned_by === user.id && !a.expires_at)
      .map((a) => a.id);
    if (freeIds.length > 0) {
      await admin
        .from('service_assignments')
        .delete()
        .eq('student_id', user.id)
        .in('id', freeIds);
    }

    const { error } = await admin.from('service_assignments').insert({
      student_id: user.id,
      service: body.service,
      assigned_by: user.id,
      source: 'manual',
      expires_at: null,
    });

    if (error) {
      return NextResponse.json(
        { error: '서비스 배정에 실패했습니다.' },
        { status: 500 },
      );
    }

    invalidateStudentServices(user.id);
    return NextResponse.json({ success: true });
  },
);
