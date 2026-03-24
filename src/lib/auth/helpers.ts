import { cache } from 'react';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { AuthUser } from '@/types/auth';
import type { UserRole } from '@/types/database';
import { logger } from '@/lib/logger';

export const getUser = cache(async (): Promise<AuthUser | null> => {
  // Fast path: read profile cached by middleware (avoids 2 redundant network calls)
  const headersList = await headers();
  const profileHeader = headersList.get('x-user-profile');
  if (profileHeader) {
    try {
      return JSON.parse(Buffer.from(profileHeader, 'base64').toString('utf-8')) as AuthUser;
    } catch {
      // Fall through to normal path
    }
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
    .select('id, email, full_name, role, academy_id')
    .eq('id', user.id)
    .single();

  if (profileError) logger.error('auth.get_profile', { error: profileError.message });
  if (!profile) return null;

  return profile as AuthUser;
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
