import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from '@/types/auth';
import { ForbiddenError } from './errors';

/**
 * 콘텐츠 mutation API에서 호출.
 * boss는 무조건 통과, teacher/admin은 학원의 can_manage_content 확인.
 */
export async function requireContentPermission(
  user: AuthUser,
  supabase: SupabaseClient
): Promise<void> {
  if (user.role === 'boss') return;

  if (!user.academy_id) {
    throw new ForbiddenError('콘텐츠 관리 권한이 없습니다.');
  }

  const { data } = await supabase
    .from('academies')
    .select('can_manage_content')
    .eq('id', user.academy_id)
    .single();

  if (!data?.can_manage_content) {
    throw new ForbiddenError('콘텐츠 관리 권한이 없습니다.');
  }
}
