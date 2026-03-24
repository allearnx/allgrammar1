import { createClient } from '@/lib/supabase/server';
import { deriveTier } from './feature-gate';
import type { Tier } from './feature-gate';

export interface PlanContext {
  tier: Tier;
  freeService: 'naesin' | 'voca' | null;
}

/** Fetch the plan context (tier + free service) for the user's academy or individual student */
export async function getPlanContext(
  academyId: string | null,
  studentId?: string,
): Promise<PlanContext> {
  if (!academyId) {
    // 독립 학생: service_assignments로 판단 (빌링 테이블 없음)
    if (studentId) {
      const supabase = await createClient();
      const { data: assignments } = await supabase
        .from('service_assignments')
        .select('service')
        .eq('student_id', studentId);

      const services = assignments?.map((a) => a.service) ?? [];
      if (services.length > 0) {
        const freeService = services.includes('voca') ? 'voca' as const
          : services.includes('naesin') ? 'naesin' as const
          : null;
        return { tier: 'free', freeService };
      }
    }
    return { tier: 'free', freeService: null };
  }

  const supabase = await createClient();

  const [{ data: academy }, { data: sub }] = await Promise.all([
    supabase.from('academies').select('services').eq('id', academyId).single(),
    supabase
      .from('subscriptions')
      .select('status, tier')
      .eq('academy_id', academyId)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const services: string[] = (academy?.services as string[]) ?? [];
  const freeService: 'naesin' | 'voca' | null =
    services.includes('voca') ? 'voca'
    : services.includes('naesin') ? 'naesin'
    : null;

  const tier: Tier = deriveTier(sub ?? null);

  return { tier, freeService };
}
