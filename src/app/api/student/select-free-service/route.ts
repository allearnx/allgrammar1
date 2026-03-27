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

    // 이미 서비스가 있는지 확인
    const { count } = await supabase
      .from('service_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: '이미 무료 서비스가 선택되어 있습니다.' },
        { status: 400 },
      );
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
