import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { AuthUser } from '@/types/auth';
import type { UserRole } from '@/types/database';

export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name, role, academy_id')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return profile as AuthUser;
}

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
