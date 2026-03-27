import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';

// 전체 구독 현황 조회 (boss only)
export const GET = createApiHandler(
  { roles: ['boss'], hasBody: false },
  async ({ supabase, request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let query = supabase
      .from('subscriptions')
      .select(`
        id, plan_id, academy_id, student_id, status, tier,
        current_period_start, current_period_end, trial_end,
        grace_period_end, failed_payment_count, canceled_at, created_by, created_at,
        plan:subscription_plans(*),
        academy:academies(id, name),
        student:users!subscriptions_student_id_fkey(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  },
);
