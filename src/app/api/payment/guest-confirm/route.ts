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
  courseId: z.string().uuid(), // 게스트 결제는 코스 가격 대조를 위해 필수
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

  // ── 멱등성 가드: 이미 승인된 주문의 재진입은 그대로 성공 응답 (재승인→중복충돌→자동취소 사고 방지) ──
  const { data: existingOrder } = await admin
    .from('orders')
    .select('status, receipt_url')
    .eq('toss_order_id', orderId)
    .maybeSingle();
  if (existingOrder?.status === 'paid') {
    return NextResponse.json({ success: true, receiptUrl: existingOrder.receipt_url ?? null });
  }

  // ── 0. 코스 가격 위변조 방어 (공개 엔드포인트 — 클라 금액을 신뢰하지 않음) ──
  // 승인(capture) 전에 차단하므로, 불일치 시 실제 청구는 일어나지 않는다.
  const { data: course } = await admin
    .from('courses')
    .select('price, is_active')
    .eq('id', courseId)
    .single();
  if (!course || course.is_active === false || course.price !== amount) {
    logger.error('payment.guest_price_mismatch', { courseId, amount, coursePrice: course?.price });
    return NextResponse.json({ error: '결제 정보가 올바르지 않습니다.' }, { status: 400 });
  }

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
    // 중복 키(23505) = 이미 기록된 주문의 동시/재진입 — 실패가 아니므로 절대 취소 금지
    if (insertErr.code === '23505') {
      logger.warn('payment.guest_duplicate_confirm', { orderId });
      return NextResponse.json({ success: true, receiptUrl: result.receipt?.url ?? null });
    }
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
