import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { billingRegisterCardSchema } from '@/lib/api/schemas';
import { issueBillingKey, TossPaymentError } from '@/lib/payments/toss';
import { createAdminClient } from '@/lib/supabase/admin';

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

    // 해당 customerKey의 구독 찾아서 billingKey 저장 (소유권 검증 포함)
    let query = supabase
      .from('subscriptions')
      .select('id')
      .eq('customer_key', customerKey)
      .in('status', ['trialing', 'active', 'past_due']);

    // 본인이 생성했거나, 본인이 학생이거나, 소속 학원 구독만 허용
    if (user.academy_id) {
      query = query.or(
        `created_by.eq.${user.id},student_id.eq.${user.id},academy_id.eq.${user.academy_id}`,
      );
    } else {
      query = query.or(`created_by.eq.${user.id},student_id.eq.${user.id}`);
    }

    const { data: subscription, error: findErr } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findErr || !subscription) {
      return NextResponse.json(
        { error: '해당 구독을 찾을 수 없습니다' },
        { status: 404 },
      );
    }

    // billingKey 업데이트 — 위에서 RLS로 소유권을 확인한 구독만, 서버(admin 클라이언트)가 저장.
    // (구독 직접 쓰기 정책은 119에서 제거. 학생·개인 구독은 원래도 RLS UPDATE 정책이 없어 저장이 조용히 0행이었음)
    const { error: updateErr } = await createAdminClient()
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
