import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chargeBilling, TossPaymentError } from '@/lib/payments/toss';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  // CRON_SECRET 인증
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results = { charged: 0, failed: 0, expired: 0 };

  try {
    // 1. 만기 구독 결제 처리 (billing_key 있고 current_period_end 지남)
    const { data: dueSubs } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .in('status', ['active', 'past_due'])
      .not('billing_key', 'is', null)
      .lte('current_period_end', new Date().toISOString());

    for (const sub of dueSubs || []) {
      await processSubscriptionCharge(supabase, sub, results);
    }

    // 2. 유예기간 만료 구독 → expired + 서비스 회수
    const { data: graceSubs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('status', 'past_due')
      .not('grace_period_end', 'is', null)
      .lte('grace_period_end', new Date().toISOString());

    for (const sub of graceSubs || []) {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', sub.id);
      results.expired++;
    }

    // 3. 카드 미등록 트라이얼 만료 → expired + 서비스 회수
    const { data: expiredTrials } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('status', 'trialing')
      .is('billing_key', null)
      .lte('trial_end', new Date().toISOString());

    for (const sub of expiredTrials || []) {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', sub.id);
      results.expired++;
    }

    // 4. 카드 등록된 트라이얼 만료 → active로 전환 + 첫 결제
    const { data: activeTrials } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('status', 'trialing')
      .not('billing_key', 'is', null)
      .lte('trial_end', new Date().toISOString());

    for (const sub of activeTrials || []) {
      await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', sub.id);
      await processSubscriptionCharge(supabase, { ...sub, status: 'active' }, results);
    }

    logger.info('cron.billing.complete', results);
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    logger.error('cron.billing.error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Billing cron failed' }, { status: 500 });
  }
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function processSubscriptionCharge(
  supabase: AdminClient,
  sub: Record<string, unknown>,
  results: { charged: number; failed: number; expired: number },
) {
  const plan = sub.plan as Record<string, unknown> | null;
  if (!plan || !sub.billing_key) return;

  // 금액 계산
  let amount: number;
  if (sub.academy_id) {
    // 학원: price_per_unit × max(학생수, min_students)
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', sub.academy_id as string)
      .eq('role', 'student')
      .eq('is_active', true);

    const studentCount = count || 0;
    const minStudents = (plan.min_students as number) || 1;
    amount = (plan.price_per_unit as number) * Math.max(studentCount, minStudents);
  } else {
    amount = plan.price_per_unit as number;
  }

  const orderId = `order_${(sub.id as string).replace(/-/g, '').slice(0, 16)}_${Date.now()}`;
  const orderName = `올라영 ${plan.name as string}`;

  try {
    const charge = await chargeBilling(sub.billing_key as string, {
      customerKey: sub.customer_key as string,
      amount,
      orderId,
      orderName,
    });

    // 성공 → 기간 갱신
    const now = new Date();
    const nextEnd = new Date(now);
    nextEnd.setMonth(nextEnd.getMonth() + 1);

    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: nextEnd.toISOString(),
        failed_payment_count: 0,
        grace_period_end: null,
      })
      .eq('id', sub.id as string);

    // 결제 내역
    await supabase.from('payment_history').insert({
      subscription_id: sub.id as string,
      toss_payment_key: charge.paymentKey,
      toss_order_id: charge.orderId,
      amount: charge.totalAmount,
      status: 'success',
      receipt_url: charge.receipt?.url || null,
      paid_at: now.toISOString(),
    });

    results.charged++;
    logger.info('cron.billing.charge_success', {
      subscriptionId: sub.id,
      amount: charge.totalAmount,
      orderId: charge.orderId,
      paymentKey: charge.paymentKey,
    });
  } catch (err) {
    const failedCount = ((sub.failed_payment_count as number) || 0) + 1;
    const graceEnd = new Date();
    graceEnd.setDate(graceEnd.getDate() + 3);

    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        failed_payment_count: failedCount,
        grace_period_end: graceEnd.toISOString(),
      })
      .eq('id', sub.id as string);

    // 실패 내역
    await supabase.from('payment_history').insert({
      subscription_id: sub.id as string,
      toss_order_id: orderId,
      amount,
      status: 'failed',
      failure_code: err instanceof TossPaymentError ? err.code : 'UNKNOWN',
      failure_message: err instanceof Error ? err.message : '알 수 없는 오류',
    });

    results.failed++;
    logger.warn('cron.billing.charge_failed', {
      subscriptionId: sub.id,
      amount,
      orderId,
      failedCount,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
