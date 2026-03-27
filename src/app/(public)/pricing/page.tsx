import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/helpers';
import type { SubscriptionPlan } from '@/types/billing';
import { PricingPageContent } from './_components/pricing-page-content';

export const metadata = {
  title: '요금제 | 올라영',
  description: '학원 맞춤 요금제를 확인하고 지금 시작하세요.',
};

export default async function PricingPage() {
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('target', 'academy')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const user = await getUser().catch(() => null);

  let currentTier: 'free' | 'paid' | null = null;
  let currentPlanId: string | null = null;

  if (user?.role === 'admin' && user.academy_id) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('tier, plan_id')
      .eq('academy_id', user.academy_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sub) {
      currentTier = sub.tier as 'free' | 'paid';
      currentPlanId = sub.plan_id;
    }
  }

  return (
    <PricingPageContent
      plans={(plans as SubscriptionPlan[]) || []}
      isLoggedIn={!!user}
      isAdmin={user?.role === 'admin'}
      currentTier={currentTier}
      currentPlanId={currentPlanId}
    />
  );
}
