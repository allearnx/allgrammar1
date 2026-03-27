import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { auditLog } from '@/lib/api/audit';

const tierChangeSchema = z.object({
  tier: z.enum(['free', 'paid']),
});

// 구독 tier 변경 (boss only)
export const PATCH = createApiHandler(
  { roles: ['boss'], schema: tierChangeSchema },
  async ({ body, params, user, supabase }) => {
    const subId = params.id;
    const { tier } = body;

    // 구독 조회
    const sub = dbResult(await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(min_students)')
      .eq('id', subId)
      .single());

    if (sub.tier === tier) {
      return NextResponse.json({ error: '이미 동일한 tier입니다.' }, { status: 400 });
    }

    const prevTier = sub.tier;
    const admin = createAdminClient();

    // 구독 tier 업데이트
    dbResult(await admin
      .from('subscriptions')
      .update({ tier })
      .eq('id', subId));

    // 학원 구독인 경우 academies 테이블도 업데이트
    if (sub.academy_id) {
      if (tier === 'paid') {
        // 유료 전환: max_students 해제 + free_service 제거
        dbResult(await admin
          .from('academies')
          .update({
            max_students: sub.plan?.min_students ?? null,
            free_service: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.academy_id));
      } else {
        // 무료 다운그레이드: max_students=5
        dbResult(await admin
          .from('academies')
          .update({
            max_students: 5,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.academy_id));
      }

      // free→paid: 기존 학생들에게 서비스 자동배정
      // paid→free: subscription 서비스 회수 (manual 보존)
      if (prevTier === 'free' && tier === 'paid') {
        await admin.rpc('sync_subscription_services', { sub_id: subId });
      } else if (prevTier !== 'free' && tier === 'free') {
        // paid→free 다운그레이드: subscription 소스 서비스만 삭제
        await admin
          .from('service_assignments')
          .delete()
          .eq('subscription_id', subId)
          .eq('source', 'subscription');
      }
    }

    await auditLog(supabase, user.id, 'subscription.tier_change', {
      type: 'subscription',
      id: subId,
      details: { from: prevTier, to: tier, academy_id: sub.academy_id },
    });

    return NextResponse.json({ success: true, tier });
  },
);
