import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';

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

    // 기존 무료 서비스 확인 (subscription 소스는 건드리지 않음)
    const { data: existing } = await supabase
      .from('service_assignments')
      .select('id, service, source')
      .eq('student_id', user.id)
      .is('subscription_id', null);

    // 이미 같은 서비스면 무시
    if (existing?.some((a) => a.service === body.service)) {
      return NextResponse.json({ success: true });
    }

    // 기존 무료 서비스가 있으면 전환 (삭제 후 삽입)
    if (existing && existing.length > 0) {
      await supabase
        .from('service_assignments')
        .delete()
        .in('id', existing.map((a) => a.id));
    }

    const { error } = await supabase.from('service_assignments').insert({
      student_id: user.id,
      service: body.service,
      assigned_by: user.id,
    });

    if (error) {
      return NextResponse.json(
        { error: '서비스 배정에 실패했습니다.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  },
);
