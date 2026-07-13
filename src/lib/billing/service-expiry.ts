/**
 * 개인 결제 서비스 만료 처리 (크론 없이 lazy)
 * - 결제 시: 코스의 duration_days만큼 만료일 설정. 기존 만료일이 남아있으면 연장(기존 만료일 + 기간)
 * - 조회 시: 만료된 배정은 비활성 취급 + 삭제 (plan-context / 서비스 목록, 5분 캐시 주기)
 */

/** 결제로 부여할 만료 시각 계산. durationDays 없으면 무기한(null) — 기존 동작 유지 */
export function computeExtendedExpiry(
  existingExpiresAt: string | null | undefined,
  durationDays: number | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!durationDays) return null;
  const existing = existingExpiresAt ? new Date(existingExpiresAt) : null;
  // 만료 전 재결제 = 남은 기간 위에 연장, 만료 후 재결제 = 오늘부터
  const base = existing && existing.getTime() > now.getTime() ? existing : now;
  return new Date(base.getTime() + durationDays * 86_400_000).toISOString();
}

/** 배정이 아직 유효한가 (expires_at null = 무기한) */
export function isAssignmentActive(
  assignment: { expires_at?: string | null },
  now: Date = new Date(),
): boolean {
  return !assignment.expires_at || new Date(assignment.expires_at).getTime() > now.getTime();
}
