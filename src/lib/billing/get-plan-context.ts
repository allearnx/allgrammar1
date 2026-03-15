import { createClient } from '@/lib/supabase/server';
import { deriveTier } from './feature-gate';
import type { Tier } from './feature-gate';

export interface PlanContext {
  tier: Tier;
  freeService: 'naesin' | 'voca' | null;
}

/** Fetch the plan context (tier + free service) for the user's academy or individual subscription */
export async function getPlanContext(
  academyId: string | null,
  studentId?: string,
): Promise<PlanContext> {
  if (!academyId) {
    // 독립 학생: 개인 구독 조회
    if (studentId) {
      const supabase = await createClient();
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, tier, plan_id, subscription_plans(services)')
        .eq('student_id', studentId)
        .in('status', ['trialing', 'active', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sub) {
        const plan = sub.subscription_plans as unknown as { services: string[] } | null;
        const services = plan?.services ?? [];
        const freeService = services.includes('voca') ? 'voca' as const
          : services.includes('naesin') ? 'naesin' as const
          : null;
        return {
          tier: deriveTier(sub as { status: string; tier: string }),
          freeService,
        };
      }
    }
    return { tier: 'free', freeService: null };
  }

  const supabase = await createClient();

  const [{ data: academy }, { data: subscription }] = await Promise.all([
    supabase
      .from('academies')
      .select('free_service')
      .eq('id', academyId)
      .single(),
    supabase
      .from('subscriptions')
      .select('status, tier')
      .eq('academy_id', academyId)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  return {
    tier: deriveTier(subscription as { status: string; tier: string } | null),
    freeService: (academy?.free_service as 'naesin' | 'voca' | null) ?? null,
  };
}
