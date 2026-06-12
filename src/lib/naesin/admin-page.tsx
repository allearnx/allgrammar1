import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

export async function getNaesinPageData(roles: UserRole[]) {
  const user = await requireRole(roles);
  const supabase = await createClient();
  const { data: textbooks } = await supabase
    .from('naesin_textbooks')
    .select('id, display_name, publisher, grade, sort_order, cover_image_url, is_active, created_at')
    .order('grade')
    .order('sort_order');
  return { user, textbooks: textbooks || [] };
}
