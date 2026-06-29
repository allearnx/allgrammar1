import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { confirmPayment, cancelPayment, TossPaymentError } from '@/lib/payments/toss';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';
import { sendTelegram } from '@/lib/telegram';

// 게스트(비로그인) 결제 승인 — 결제만 하고 앱은 안 쓰는 고객용.
// 주문은 이름+휴대폰으로만 기록하고 서비스(앱 접근)는 부여하지 않는다.
const schema = z.object({
  paymentKey: z.string().min(1).max(200),
  orderId: z.string().min(1).max(64),
  amount: z.number().int().positive(),
  orderName: z.string().min(1).max(200),
  courseId: z.string().uuid().optional(),
  guestName: z.string().trim().min(1).max(50),
  guestPhone: z.string().trim().min(8).max(20),
});

export async function POST(request: NextRequest) {
  // 레이트리밋 (IP 기준, 시간당 10회)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limited = await checkRateLimit(ip, 'payment/guest-confirm', 10);
  if (limited) return limited;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: '잘못된 결제 정보입니다.' }, { status: 400 });
  }

  const { paymentKey, orderId, amount, orderName, courseId, guestName, guestPhone } = body;
  const admin = createAdminClient();

  // ── 1. 토스 결제 승인 ──
  let result;
  try {
    result = await confirmPayment(paymentKey, orderId, amount);
  } catch (err) {
    await admin.from('orders').insert({
      order_name: orderName,
      amount,
      status: 'failed',
      toss_order_id: orderId,
      toss_payment_key: paymentKey,
      course_id: courseId || null,
      guest_name: guestName,
      guest_phone: guestPhone,
      failure_code: err instanceof TossPaymentError ? err.code : 'UNKNOWN',
      failure_message: err instanceof Error ? err.message : '결제 승인 실패',
    });
    if (err instanceof TossPaymentError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    throw err;
  }

  // ── 2. 금액 위변조 방어 ──
  if (result.totalAmount !== amount) {
    logger.error('payment.guest_amount_mismatch', { orderId, clientAmount: amount, tossAmount: result.totalAmount });
    await cancelPayment(result.paymentKey, '결제 금액 불일치로 인한 자동 취소');
    await sendTelegram(
      `🚨 게스트 결제 금액 위변조 감지\n\n클라이언트: ${amount}원\n토스: ${result.totalAmount}원\n게스트: ${guestName} (${guestPhone})\n주문: ${orderId}\n\n→ 자동 취소 완료`,
    );
    return NextResponse.json({ error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
  }

  // ── 3. 주문 기록 (게스트 — user_id 없음, 서비스 부여 없음) ──
  const { error: insertErr } = await admin.from('orders').insert({
    order_name: orderName,
    amount: result.totalAmount,
    status: 'paid',
    toss_order_id: orderId,
    toss_payment_key: result.paymentKey,
    receipt_url: result.receipt?.url ?? null,
    course_id: courseId || null,
    guest_name: guestName,
    guest_phone: guestPhone,
    paid_at: new Date().toISOString(),
  });

  if (insertErr) {
    logger.error('payment.guest_insert_failed', { orderId, error: insertErr.message });
    try {
      await cancelPayment(result.paymentKey, '주문 기록 저장 실패로 인한 자동 취소');
    } catch (cancelErr) {
      logger.error('payment.guest_cancel_also_failed', { orderId, error: cancelErr instanceof Error ? cancelErr.message : String(cancelErr) });
    }
    await sendTelegram(
      `🚨 게스트 결제 긴급\n\n주문 기록 저장 실패 → 토스 취소 시도\n주문: ${orderId}\n금액: ${result.totalAmount}원\n게스트: ${guestName} (${guestPhone})\n에러: ${insertErr.message}`,
    );
    return NextResponse.json({ error: '주문 처리 중 오류가 발생했습니다. 결제가 취소되었습니다.' }, { status: 500 });
  }

  await sendTelegram(
    [
      '💰 게스트 결제 완료',
      '',
      `👤 ${guestName} (${guestPhone})`,
      `📦 ${orderName}`,
      `💳 ${result.totalAmount.toLocaleString()}원`,
      `🔖 주문번호: ${orderId}`,
    ].join('\n'),
  );

  return NextResponse.json({ success: true, receiptUrl: result.receipt?.url ?? null });
}
