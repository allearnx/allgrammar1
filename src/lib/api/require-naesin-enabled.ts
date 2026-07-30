import type { AuthUser } from '@/types/auth';

/**
 * 내신 관리 API 잠금 — 올라영 전용 (academies.naesin_enabled).
 *
 * /api/naesin/* 를 teacher/admin이 호출하면 소속 학원의 naesin_enabled가 필요하다.
 * - boss: 항상 통과
 * - student: 통과 (무료 tier 내신 1단원 체험은 의도된 기능 — 한도는 페이지에서 적용)
 * - teacher/admin: 학원 naesin_enabled 필요 — 외부 가입 학원이 관리 API로
 *   내신 콘텐츠 전체를 열람/수정하는 것을 차단 (RLS 우회하는 admin client 라우트 포함)
 *
 * createApiHandler가 경로 기준으로 자동 적용한다 (라우트별 개별 설정 불필요).
 */
export function isNaesinManagementBlocked(pathname: string, user: AuthUser): boolean {
  if (!pathname.startsWith('/api/naesin')) return false;
  if (user.role !== 'teacher' && user.role !== 'admin') return false;
  return !user.naesin_enabled;
}
