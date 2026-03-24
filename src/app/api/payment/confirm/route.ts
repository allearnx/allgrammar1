import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { paymentConfirmSchema } from '@/lib/api/schemas';
import { confirmPayment, TossPaymentError } from '@/lib/payments/toss';
import { logger } from '@/lib/logger';

export const POST = createApiHandler(
  { schema: paymentConfirmSchema },
  async ({ user, body, supabase }) => {
    const { paymentKey, orderId, amount, orderName } = body;

    // 토스 결제 승인
    let result;
    try {
      result = await confirmPayment(paymentKey, orderId, amount);
    } catch (err) {
      // 실패 시 orders에 failed 기록
      await supabase.from('orders').insert({
        user_id: user.id,
        order_name: orderName,
        amount,
        status: 'failed',
        toss_order_id: orderId,
        toss_payment_key: paymentKey,
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

    // 성공 → orders에 paid 기록
    const { error: insertErr } = await supabase.from('orders').insert({
      user_id: user.id,
      order_name: orderName,
      amount: result.totalAmount,
      status: 'paid',
      toss_order_id: orderId,
      toss_payment_key: result.paymentKey,
      receipt_url: result.receipt?.url ?? null,
      paid_at: new Date().toISOString(),
    });

    if (insertErr) {
      logger.error('payment.insert_failed', {
        orderId,
        userId: user.id,
        error: insertErr.message,
      });
      return NextResponse.json(
        { error: '주문 기록 저장 실패' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      receiptUrl: result.receipt?.url ?? null,
    });
  },
);
