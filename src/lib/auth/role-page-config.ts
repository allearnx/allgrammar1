import { notFound } from 'next/navigation';
import type { UserRole } from '@/types/database';

export type DashboardRole = 'admin' | 'boss' | 'teacher';

const VALID_ROLES = new Set<string>(['admin', 'boss', 'teacher']);

type BasePath = '/admin' | '/boss' | '/teacher';

const ROLE_CONFIG: Record<DashboardRole, { allowedRoles: UserRole[]; basePath: BasePath }> = {
  admin: { allowedRoles: ['admin', 'boss'], basePath: '/admin' },
  boss: { allowedRoles: ['boss'], basePath: '/boss' },
  teacher: { allowedRoles: ['teacher', 'admin', 'boss'], basePath: '/teacher' },
};

export function getRoleConfig(role: string) {
  if (!VALID_ROLES.has(role)) notFound();
  return ROLE_CONFIG[role as DashboardRole];
}
