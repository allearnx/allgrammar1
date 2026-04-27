import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

function verifyWebhookSecret(received: unknown): boolean {
  const expected = process.env.TOSS_PAYMENTS_SECRET_KEY;
  if (!expected) return false;
  if (typeof received !== 'string') return false;

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 웹훅 시크릿 검증
    if (!verifyWebhookSecret(body.secret)) {
      logger.warn('toss.webhook.unauthorized', { hasSecret: !!body.secret });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventType, data } = body;

    logger.info('toss.webhook', { eventType, paymentKey: data?.paymentKey });

    const supabase = createAdminClient();

    switch (eventType) {
      case 'BILLING_STATUS_CHANGED': {
        if (data?.billingKey && data?.status === 'EXPIRED') {
          // billing_key로 구독 찾기
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('id, status')
            .eq('billing_key', data.billingKey)
            .single();

          if (sub) {
            // billing_key 제거 + past_due로 전환 (보스가 수동 판단할 수 있도록)
            await supabase
              .from('subscriptions')
              .update({
                billing_key: null,
                status: sub.status === 'active' ? 'past_due' : sub.status,
                grace_period_end: sub.status === 'active'
                  ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                  : undefined,
              })
              .eq('id', sub.id);

            logger.info('toss.webhook.billing_expired', {
              subscriptionId: sub.id,
              previousStatus: sub.status,
            });
          }
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
