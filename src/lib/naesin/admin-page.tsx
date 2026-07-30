import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

export async function getNaesinPageData(roles: UserRole[]) {
  const user = await requireRole(roles);
  // 내신 관리 화면은 올라영 전용 — 학원의 naesin_enabled 필요 (boss는 통과)
  if (user.role !== 'boss' && !user.naesin_enabled) {
    redirect(`/${user.role}`);
  }
  const supabase = await createClient();
  const { data: textbooks } = await supabase
    .from('naesin_textbooks')
    // naesin_textbooks에 cover_image_url 컬럼 없음 — select에 넣으면 쿼리 에러로 교과서 전체가 빈 목록이 됨
    .select('id, display_name, publisher, grade, sort_order, is_active, created_at')
    .order('grade')
    .order('sort_order');
  return { user, textbooks: textbooks || [] };
}
