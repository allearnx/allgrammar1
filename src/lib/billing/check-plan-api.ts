import { NextResponse } from 'next/server';
import { getPlanContext } from './get-plan-context';
import { canUseFeature, isServiceAllowed } from './feature-gate';
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
