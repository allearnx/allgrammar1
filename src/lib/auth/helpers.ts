import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { AuthUser } from '@/types/auth';
import type { UserRole } from '@/types/database';
import { logger } from '@/lib/logger';
import { hashAuthCookies, verifyProfileToken } from '@/lib/auth/profile-cache';

export const getUser = cache(async (): Promise<AuthUser | null> => {
  // Fast path: read profile cached by middleware (avoids 2 redundant network calls)
  // HMAC 서명 + 현재 인증 쿠키 해시가 일치할 때만 신뢰 — 위조 헤더·다른 세션의
  // 잔여 캐시는 검증 실패로 아래 Supabase 직접 조회 경로로 떨어진다.
  const headersList = await headers();
  const profileHeader = headersList.get('x-user-profile');
  if (profileHeader) {
    const cookieStore = await cookies();
    const sessionHash = await hashAuthCookies(cookieStore.getAll());
    const profile = await verifyProfileToken(profileHeader, sessionHash);
    if (profile) return profile as AuthUser;
    // Fall through to normal path
  }

  // Fallback: fetch from Supabase directly
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) logger.error('auth.get_user', { error: authError.message });
  if (!user) {
    logger.warn('auth.no_user');
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, full_name, role, academy_id, is_homepage_manager')
    .eq('id', user.id)
    .single();

  if (profileError) logger.error('auth.get_profile', { error: profileError.message });
  if (!profile) return null;

  let canManageContent = false;
  let naesinEnabled = false;
  if (profile.academy_id) {
    const { data: acad } = await supabase
      .from('academies')
      .select('can_manage_content, naesin_enabled')
      .eq('id', profile.academy_id)
      .single();
    canManageContent = acad?.can_manage_content ?? false;
    naesinEnabled = acad?.naesin_enabled ?? false;
  }

  return { ...profile, can_manage_content: canManageContent, naesin_enabled: naesinEnabled } as AuthUser;
});

export async function requireUser(): Promise<AuthUser> {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    redirect('/login');
  }
  return user;
}
