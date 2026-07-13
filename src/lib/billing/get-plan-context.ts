import { createAdminClient } from '@/lib/supabase/admin';
import { cached, TTL } from '@/lib/cache/server-cache';
import { cacheTags } from '@/lib/cache/tags';
import { deriveTier } from './feature-gate';
import { isAssignmentActive } from './service-expiry';
import type { Tier } from './feature-gate';

export interface PlanContext {
  tier: Tier;
  freeService: 'naesin' | 'voca' | null;
  /** 올킬보카 학생에게 올인내신 암기 스테이지만 할당된 경우 */
  naesinMemorizeOnly: boolean;
}

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * 학생 배정 조회 + 만료 처리 (크론 없이 lazy).
 * expires_at이 지난 행은 삭제하고 유효한 배정만 반환 — 5분 캐시 주기로 정리된다.
 */
async function fetchActiveAssignments(supabase: AdminClient, studentId: string) {
  const { data } = await supabase
    .from('service_assignments')
    .select('id, service, source, naesin_memorize_only, expires_at')
    .eq('student_id', studentId);
  const all = data ?? [];
  const expired = all.filter((a) => !isAssignmentActive(a));
  if (expired.length > 0) {
    await supabase.from('service_assignments').delete().in('id', expired.map((a) => a.id));
  }
  return all.filter((a) => isAssignmentActive(a));
}

/** 실제 plan context 계산 (academies + subscriptions + service_assignments 조회) */
async function computePlanContext(
  supabase: AdminClient,
  academyId: string | null,
  studentId?: string,
): Promise<PlanContext> {
  if (!academyId) {
    // 독립 학생: 구독 테이블 먼저 확인, 없으면 service_assignments로 판단
    if (studentId) {
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

      // Free tier 또는 구독 없음: service_assignments로 판단 (만료 배정 제외)
      const services = await fetchActiveAssignments(supabase, studentId);
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

  // 학생 개별 service_assignments 조회 (naesin_memorize_only 포함, 만료 배정 제외)
  let memorizeOnly = false;
  if (studentId) {
    const studentServices = await fetchActiveAssignments(supabase, studentId);
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

/**
 * 캐시된 plan context — TTL 5분(SESSION).
 * academies/subscriptions/service_assignments를 매 페이지 렌더마다 재조회하던 것을 캐싱
 * (egress·compute 절감). 서비스 배정/결제 변경 시 기존 무효화 헬퍼
 * (invalidateStudentServices / invalidatePayment)가 태그로 즉시 갱신한다.
 */
const getCachedPlanContext = cached(
  async (academyId: string | null, studentId: string | undefined) => {
    const admin = createAdminClient();
    return computePlanContext(admin, academyId, studentId);
  },
  'plan-context',
  TTL.SESSION,
  (academyId, studentId) => {
    const tags: string[] = [];
    if (studentId) tags.push(cacheTags.studentServices(studentId));
    if (academyId) tags.push(cacheTags.isPaid(academyId));
    return tags;
  },
);

/** Fetch the plan context (tier + free service) for the user's academy or individual student */
export async function getPlanContext(
  academyId: string | null,
  studentId?: string,
): Promise<PlanContext> {
  return getCachedPlanContext(academyId, studentId);
}
