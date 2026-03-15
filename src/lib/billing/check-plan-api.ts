import { NextResponse } from 'next/server';
import type { Feature } from './feature-gate';

/**
 * Server-side plan check for API routes.
 * 빌링 미적용 상태: 제한 없이 모든 기능 허용.
 */
export async function checkPlanGate(_academyId: string | null, _feature: Feature): Promise<NextResponse | null> {
  return null;
}

/**
 * Check if the academy is allowed to assign the given services.
 * 빌링 미적용 상태: 제한 없이 모든 서비스 허용.
 */
export async function checkServiceGate(
  _academyId: string | null,
  _services: string[],
): Promise<NextResponse | null> {
  return null;
}
