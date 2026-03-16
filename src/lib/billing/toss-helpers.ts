import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function requestTossCardAuth(customerKey: string) {
  // @ts-expect-error -- tosspayments sdk loaded via script
  const tossPayments = window.TossPayments?.(
    process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY,
  );
  if (!tossPayments) {
    toast.error('결제 모듈을 불러올 수 없습니다');
    return;
  }

  const payment = tossPayments.payment({ customerKey });
  payment.requestBillingAuth('카드', {
    successUrl: `${window.location.origin}/billing/callback?customerKey=${customerKey}`,
    failUrl: `${window.location.origin}/billing/callback`,
  });
}

export async function cancelSubscription(subscriptionId: string, onSuccess: () => void) {
  if (!confirm('정말 구독을 해지하시겠습니까? 현재 기간이 끝나면 서비스가 중단됩니다.')) return;

  const supabase = createClient();
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'canceled', canceled_at: new Date().toISOString() })
    .eq('id', subscriptionId);

  if (error) {
    toast.error('해지 실패');
  } else {
    toast.success('구독이 해지되었습니다');
    onSuccess();
  }
}

export function calcTrialDaysLeft(trialEnd: string | null): number {
  if (!trialEnd) return 0;
  return Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000));
}
