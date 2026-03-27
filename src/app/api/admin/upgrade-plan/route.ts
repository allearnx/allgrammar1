import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { upgradePlanSchema } from '@/lib/api/schemas';
import { confirmPayment, cancelPayment, TossPaymentError } from '@/lib/payments/toss';
import { createAdminClient } from '@/lib/supabase/admin';
import { auditLog } from '@/lib/api/audit';
import { logger } from '@/lib/logger';
import { sendTelegram } from '@/lib/telegram';

export const POST = createApiHandler(
  { roles: ['admin'], schema: upgradePlanSchema },
  async ({ user, body, supabase }) => {
    const { paymentKey, orderId, amount, planId } = body;

    // ── 1. 대상 플랜 조회 ──
    const plan = dbResult(await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .eq('target', 'academy')
      .single());

    if (plan.price_per_unit !== amount) {
      return NextResponse.json(
        { error: '결제 금액이 요금제 금액과 일치하지 않습니다.' },
        { status: 400 },
      );
    }

    // ── 2. 현재 구독 조회 (free 확인) ──
    if (!user.academy_id) {
      return NextResponse.json({ error: '학원 정보가 없습니다.' }, { status: 400 });
    }

    const sub = dbResult(await supabase
      .from('subscriptions')
      .select('id, tier, plan_id, academy_id')
      .eq('academy_id', user.academy_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single());

    if (!sub) {
      return NextResponse.json({ error: '구독 정보를 찾을 수 없습니다.' }, { status: 400 });
    }

    if (sub.tier !== 'free') {
      return NextResponse.json({ error: '이미 유료 플랜을 이용 중입니다.' }, { status: 400 });
    }

    // ── 3. 토스 결제 승인 ──
    let result;
    try {
      result = await confirmPayment(paymentKey, orderId, amount);
    } catch (err) {
      if (err instanceof TossPaymentError) {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: err.statusCode },
        );
      }
      throw err;
    }

    // ── 3-1. 금액 위변조 방어 ──
    if (result.totalAmount !== amount) {
      logger.error('upgrade.amount_mismatch', {
        orderId,
        clientAmount: amount,
        tossAmount: result.totalAmount,
        userId: user.id,
      });
      await cancelPayment(result.paymentKey, '결제 금액 불일치로 인한 자동 취소');
      sendTelegram(
        `🚨 업그레이드 금액 위변조 감지\n\n클라이언트: ${amount}원\n토스: ${result.totalAmount}원\n유저: ${user.email}\n주문: ${orderId}\n\n→ 자동 취소 완료`
      );
      return NextResponse.json(
        { error: '결제 금액이 일치하지 않습니다.' },
        { status: 400 },
      );
    }

    // ── 4. DB 업데이트 (admin client) ──
    const admin = createAdminClient();
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    // 4-1. subscription 업데이트
    const { error: subErr } = await admin
      .from('subscriptions')
      .update({
        tier: 'paid',
        plan_id: planId,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq('id', sub.id);

    if (subErr) {
      logger.error('upgrade.subscription_update_failed', {
        subId: sub.id,
        error: subErr.message,
      });
      // 결제는 성공했으므로 취소하지 않고 수동 대응
      sendTelegram(
        `🚨 업그레이드 DB 오류\n\n구독 업데이트 실패\n구독ID: ${sub.id}\n유저: ${user.email}\n에러: ${subErr.message}\n\n결제는 완료됨 — 수동 처리 필요`
      );
      return NextResponse.json(
        { error: '업그레이드 처리 중 오류가 발생했습니다. 고객센터로 문의해주세요.' },
        { status: 500 },
      );
    }

    // 4-2. academies 업데이트 (max_students + free_service 제거)
    await admin
      .from('academies')
      .update({
        max_students: plan.min_students,
        free_service: null,
        updated_at: now.toISOString(),
      })
      .eq('id', user.academy_id);

    // 4-3. payment_history 기록
    await admin.from('payment_history').insert({
      subscription_id: sub.id,
      toss_payment_key: result.paymentKey,
      toss_order_id: orderId,
      amount: result.totalAmount,
      status: 'success',
      receipt_url: result.receipt?.url ?? null,
      paid_at: now.toISOString(),
    });

    // 4-4. 학생 서비스 자동배정
    await admin.rpc('sync_subscription_services', { sub_id: sub.id });

    // ── 5. audit log + 텔레그램 ──
    await auditLog(supabase, user.id, 'subscription.upgrade', {
      type: 'subscription',
      id: sub.id,
      details: { planId, planName: plan.name, amount: result.totalAmount },
    });

    sendTelegram(
      [
        '🎉 학원 업그레이드 완료',
        '',
        `👤 ${user.email}`,
        `📦 ${plan.name} (${plan.min_students}명)`,
        `💳 ${result.totalAmount.toLocaleString()}원`,
        `🔖 주문번호: ${orderId}`,
        '✅ 학생 서비스 자동배정 완료',
      ].join('\n'),
    );

    return NextResponse.json({
      success: true,
      planName: plan.name,
      receiptUrl: result.receipt?.url ?? null,
    });
  },
);
