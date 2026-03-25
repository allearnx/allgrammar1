import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { paymentConfirmSchema } from '@/lib/api/schemas';
import { confirmPayment, cancelPayment, TossPaymentError } from '@/lib/payments/toss';
import { logger } from '@/lib/logger';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const CATEGORY_TO_SERVICE: Record<string, 'voca' | 'naesin'> = {
  voca: 'voca',
  school_exam: 'naesin',
};

async function sendUrgentTelegram(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
    });
  } catch (err) {
    logger.error('telegram.urgent_failed', { error: err instanceof Error ? err.message : String(err) });
  }
}

export const POST = createApiHandler(
  { schema: paymentConfirmSchema },
  async ({ user, body, supabase }) => {
    const { paymentKey, orderId, amount, orderName, courseId } = body;

    // ── 1. 토스 결제 승인 ──
    let result;
    try {
      result = await confirmPayment(paymentKey, orderId, amount);
    } catch (err) {
      await supabase.from('orders').insert({
        user_id: user.id,
        order_name: orderName,
        amount,
        status: 'failed',
        toss_order_id: orderId,
        toss_payment_key: paymentKey,
        course_id: courseId || null,
        failure_code: err instanceof TossPaymentError ? err.code : 'UNKNOWN',
        failure_message: err instanceof Error ? err.message : '결제 승인 실패',
      });

      if (err instanceof TossPaymentError) {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: err.statusCode },
        );
      }
      throw err;
    }

    // ── 2. 주문 기록 저장 ──
    const { error: insertErr } = await supabase.from('orders').insert({
      user_id: user.id,
      order_name: orderName,
      amount: result.totalAmount,
      status: 'paid',
      toss_order_id: orderId,
      toss_payment_key: result.paymentKey,
      receipt_url: result.receipt?.url ?? null,
      course_id: courseId || null,
      paid_at: new Date().toISOString(),
    });

    if (insertErr) {
      logger.error('payment.insert_failed', {
        orderId,
        userId: user.id,
        error: insertErr.message,
      });

      // 주문 기록 실패 → 토스 결제 즉시 취소
      try {
        await cancelPayment(result.paymentKey, '주문 기록 저장 실패로 인한 자동 취소');
        logger.error('payment.auto_canceled', { orderId, paymentKey: result.paymentKey });
      } catch (cancelErr) {
        logger.error('payment.cancel_also_failed', {
          orderId,
          paymentKey: result.paymentKey,
          error: cancelErr instanceof Error ? cancelErr.message : String(cancelErr),
        });
      }

      sendUrgentTelegram(
        `🚨 결제 긴급 알림\n\n주문 기록 저장 실패 → 토스 취소 시도\n주문: ${orderId}\n금액: ${result.totalAmount}원\n유저: ${user.email}\n에러: ${insertErr.message}`
      );

      return NextResponse.json(
        { error: '주문 처리 중 오류가 발생했습니다. 결제가 취소되었습니다.' },
        { status: 500 },
      );
    }

    // ── 3. 서비스 자동 활성화 (voca/school_exam 코스만) ──
    let serviceActivated: 'voca' | 'naesin' | null = null;

    if (courseId) {
      const { data: course } = await supabase
        .from('courses')
        .select('category')
        .eq('id', courseId)
        .single();

      const service = course ? CATEGORY_TO_SERVICE[course.category] : null;

      if (service) {
        const { error: assignErr } = await supabase
          .from('service_assignments')
          .upsert(
            {
              student_id: user.id,
              service,
              assigned_by: user.id,
              source: 'payment',
              ...(service === 'voca' ? { round2_unlocked: true } : {}),
            },
            { onConflict: 'student_id,service' },
          );

        if (assignErr) {
          logger.error('payment.service_activation_failed', {
            orderId,
            userId: user.id,
            service,
            error: assignErr.message,
          });

          // 돈은 받았으니 취소 안 함 — 수동 대응
          sendUrgentTelegram(
            `🚨 서비스 활성화 실패\n\n결제는 성공했으나 서비스 배정 실패\n주문: ${orderId}\n서비스: ${service}\n유저: ${user.email}\n에러: ${assignErr.message}\n\n👉 수동으로 서비스 배정 필요`
          );
        } else {
          serviceActivated = service;
        }
      }
    }

    // ── 4. 결제 성공 텔레그램 알림 ──
    const serviceName = serviceActivated === 'voca' ? '올킬보카' : serviceActivated === 'naesin' ? '올인내신' : null;
    sendUrgentTelegram(
      [
        '💰 결제 완료',
        '',
        `👤 ${user.email}`,
        `📦 ${orderName}`,
        `💳 ${result.totalAmount.toLocaleString()}원`,
        `🔖 주문번호: ${orderId}`,
        serviceName ? `✅ ${serviceName} 자동 활성화 완료` : '',
      ].filter(Boolean).join('\n'),
    );

    return NextResponse.json({
      success: true,
      receiptUrl: result.receipt?.url ?? null,
      serviceActivated,
    });
  },
);
