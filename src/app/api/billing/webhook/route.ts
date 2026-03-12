import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, data } = body;

    logger.info('toss.webhook', { eventType, paymentKey: data?.paymentKey });

    const supabase = createAdminClient();

    switch (eventType) {
      case 'BILLING_STATUS_CHANGED': {
        // 빌링 상태 변경 처리
        if (data?.billingKey && data?.status === 'EXPIRED') {
          await supabase
            .from('subscriptions')
            .update({ billing_key: null })
            .eq('billing_key', data.billingKey);
        }
        break;
      }
      default:
        logger.info('toss.webhook.unhandled', { eventType });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('toss.webhook.error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
