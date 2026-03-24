import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from '@/types/auth';
import { ForbiddenError } from './errors';

/**
 * 학원 범위 검증: teacher/admin이 타 학원 학생 데이터에 접근하지 못하도록 차단.
 * boss는 무조건 통과.
 */
export async function requireAcademyScope(
  user: AuthUser,
  studentId: string,
  supabase: SupabaseClient
): Promise<void> {
  if (user.role === 'boss') return;

  if (!user.academy_id) {
    throw new ForbiddenError('학원 소속이 아닙니다.');
  }

  const { data: student } = await supabase
    .from('users')
    .select('academy_id')
    .eq('id', studentId)
    .single();

  if (!student || student.academy_id !== user.academy_id) {
    throw new ForbiddenError('해당 학생에 대한 접근 권한이 없습니다.');
  }
}
