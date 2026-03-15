import { createClient } from '@/lib/supabase/server';
import { deriveTier } from './feature-gate';
import type { Tier } from './feature-gate';

export interface PlanContext {
  tier: Tier;
  freeService: 'naesin' | 'voca' | null;
}

/** Fetch the plan context (tier + free service) for the user's academy */
export async function getPlanContext(academyId: string | null): Promise<PlanContext> {
  if (!academyId) {
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
