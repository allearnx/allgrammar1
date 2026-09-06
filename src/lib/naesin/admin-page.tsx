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
  const [{ data: textbooks }, { data: unitRows }, { data: materialRows }] = await Promise.all([
    supabase
      .from('naesin_textbooks')
      // naesin_textbooks에 cover_image_url 컬럼 없음 — select에 넣으면 쿼리 에러로 교과서 전체가 빈 목록이 됨
      .select('id, display_name, publisher, grade, sort_order, is_active, created_at')
      .order('grade')
      .order('sort_order'),
    supabase.from('naesin_units').select('textbook_id'),
    supabase.from('naesin_textbook_materials').select('textbook_id'),
  ]);
  const unitCounts: Record<string, number> = {};
  (unitRows || []).forEach((u: { textbook_id: string }) => {
    unitCounts[u.textbook_id] = (unitCounts[u.textbook_id] || 0) + 1;
  });
  const materialCounts: Record<string, number> = {};
  (materialRows || []).forEach((m: { textbook_id: string }) => {
    materialCounts[m.textbook_id] = (materialCounts[m.textbook_id] || 0) + 1;
  });
  return { user, textbooks: textbooks || [], unitCounts, materialCounts };
}
