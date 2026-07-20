import { NextResponse } from 'next/server';
import { getPlanContext } from './get-plan-context';
import { canUseFeature, isServiceAllowed } from './feature-gate';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Feature } from './feature-gate';

/**
 * Server-side plan check for API routes.
 * Returns a 403 response if the feature is not available for the tier, or null if allowed.
 */
export async function checkPlanGate(academyId: string | null, feature: Feature): Promise<NextResponse | null> {
  const { tier } = await getPlanContext(academyId);
  if (!canUseFeature(tier, feature)) {
    return NextResponse.json(
      { error: '유료 플랜이 필요합니다', requiredPlan: 'paid' },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Check if the academy is allowed to assign the given services.
 * Returns a 403 response if any service is not allowed, or null if all are allowed.
 */
export async function checkServiceGate(
  academyId: string | null,
  services: string[],
): Promise<NextResponse | null> {
  // 학원 계약 서비스 제한 — academies.services가 비어있지 않으면 그 목록의 서비스만 배정 가능.
  // 올킬보카 학원 플랜은 학원 관리에서 ['voca']로 설정해 올인내신 배정을 차단한다
  // (2026-07-20 사장님 결정: 보카 플랜 결제 학원은 내신 접근 불가). 빈 배열 = 제한 없음(기존 학원 호환).
  if (academyId) {
    const { data: academy } = await createAdminClient()
      .from('academies')
      .select('services')
      .eq('id', academyId)
      .single();
    const allowed = (academy?.services ?? []) as string[];
    if (allowed.length > 0) {
      for (const service of services) {
        if ((service === 'naesin' || service === 'voca') && !allowed.includes(service)) {
          const label = service === 'naesin' ? '올인내신' : '올킬보카';
          return NextResponse.json(
            { error: `이 학원의 이용 서비스에 ${label}이(가) 포함되어 있지 않습니다.` },
            { status: 403 },
          );
        }
      }
    }
  }

  const { tier, freeService } = await getPlanContext(academyId);
  for (const service of services) {
    if (service !== 'naesin' && service !== 'voca') continue;
    if (!isServiceAllowed(tier, freeService, service)) {
      return NextResponse.json(
        { error: `서비스 "${service}"은(는) 현재 플랜에서 사용할 수 없습니다`, requiredPlan: 'paid' },
        { status: 403 },
      );
    }
  }
  return null;
}
