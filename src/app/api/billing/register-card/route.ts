import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { billingRegisterCardSchema } from '@/lib/api/schemas';
import { issueBillingKey, TossPaymentError } from '@/lib/payments/toss';

export const POST = createApiHandler(
  { schema: billingRegisterCardSchema },
  async ({ user, body, supabase }) => {
    const { authKey, customerKey } = body;

    // 빌링키 발급
    let result;
    try {
      result = await issueBillingKey(authKey, customerKey);
    } catch (err) {
      if (err instanceof TossPaymentError) {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: err.statusCode },
        );
      }
      throw err;
    }

    // 해당 customerKey의 구독 찾아서 billingKey 저장
    const { data: subscription, error: findErr } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('customer_key', customerKey)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findErr || !subscription) {
      return NextResponse.json(
        { error: '해당 구독을 찾을 수 없습니다' },
        { status: 404 },
      );
    }

    // billingKey 업데이트
    const { error: updateErr } = await supabase
      .from('subscriptions')
      .update({ billing_key: result.billingKey })
      .eq('id', subscription.id);

    if (updateErr) {
      return NextResponse.json(
        { error: '빌링키 저장 실패' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      cardCompany: result.cardCompany,
      cardNumber: result.cardNumber,
    });
  },
);
