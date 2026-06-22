import { createClient } from '@/lib/supabase/server';
import { deriveTier } from './feature-gate';
import type { Tier } from './feature-gate';

export interface PlanContext {
  tier: Tier;
  freeService: 'naesin' | 'voca' | null;
  /** 올킬보카 학생에게 올인내신 암기 스테이지만 할당된 경우 */
  naesinMemorizeOnly: boolean;
}

/** Fetch the plan context (tier + free service) for the user's academy or individual student */
export async function getPlanContext(
  academyId: string | null,
  studentId?: string,
): Promise<PlanContext> {
  if (!academyId) {
    // 독립 학생: 구독 테이블 먼저 확인, 없으면 service_assignments로 판단
    if (studentId) {
      const supabase = await createClient();

      // 구독이 있으면 (유료 업그레이드한 학생) 구독 기반으로 판단
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, tier')
        .eq('student_id', studentId)
        .in('status', ['trialing', 'active', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sub) {
        const tier = deriveTier(sub);
        if (tier === 'paid' || tier === 'trialing') {
          return { tier, freeService: null, naesinMemorizeOnly: false };
        }
      }

      // Free tier 또는 구독 없음: service_assignments로 판단
      const { data: assignments } = await supabase
        .from('service_assignments')
        .select('service, source, naesin_memorize_only')
        .eq('student_id', studentId);

      const services = assignments ?? [];
      // 'payment'(개인결제) + 'subscription'(학원/구독) 둘 다 유료. subscription 누락이 b58e270 버그의 잔여.
      const hasPaidAssignment = services.some((a) => a.source === 'payment' || a.source === 'subscription');
      const memorizeOnly = services.some(
        (a) => a.service === 'naesin' && a.naesin_memorize_only,
      );

      if (services.length > 0) {
        if (hasPaidAssignment) {
          return { tier: 'paid', freeService: null, naesinMemorizeOnly: false };
        }
        const freeService = services.some((a) => a.service === 'voca') ? 'voca' as const
          : services.some((a) => a.service === 'naesin') ? 'naesin' as const
          : null;
        return { tier: 'free', freeService, naesinMemorizeOnly: memorizeOnly };
      }
    }
    return { tier: 'free', freeService: null, naesinMemorizeOnly: false };
  }

  const supabase = await createClient();

  const [{ data: academy }, { data: sub }] = await Promise.all([
    supabase.from('academies').select('free_service').eq('id', academyId).single(),
    supabase
      .from('subscriptions')
      .select('status, tier')
      .eq('academy_id', academyId)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const tier: Tier = deriveTier(sub ?? null);

  // 학생 개별 service_assignments 조회 (naesin_memorize_only 포함)
  let memorizeOnly = false;
  if (studentId) {
    const { data: studentAssignments } = await supabase
      .from('service_assignments')
      .select('service, source, naesin_memorize_only')
      .eq('student_id', studentId);

    const studentServices = studentAssignments ?? [];
    memorizeOnly = studentServices.some(
      (a) => a.service === 'naesin' && a.naesin_memorize_only,
    );

    // Free tier 학원: 학생 개인 service_assignments 기반으로 freeService 결정
    if (tier === 'free') {
      if (studentServices.length > 0) {
        if (studentServices.some((a) => a.source === 'payment' || a.source === 'subscription')) {
          return { tier: 'paid', freeService: null, naesinMemorizeOnly: false };
        }
        const studentFreeService = studentServices.some((a) => a.service === 'voca') ? 'voca' as const
          : studentServices.some((a) => a.service === 'naesin') ? 'naesin' as const
          : null;
        return { tier, freeService: studentFreeService, naesinMemorizeOnly: memorizeOnly };
      }
      // 학생 개인 선택 없으면 academy.free_service 폴백
      const freeService: 'naesin' | 'voca' | null =
        (academy?.free_service as 'naesin' | 'voca') ?? null;
      return { tier, freeService, naesinMemorizeOnly: false };
    }
  }

  const freeService: 'naesin' | 'voca' | null =
    (academy?.free_service as 'naesin' | 'voca') ?? null;

  return { tier, freeService, naesinMemorizeOnly: memorizeOnly };
}
