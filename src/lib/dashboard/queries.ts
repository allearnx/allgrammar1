import { createAdminClient } from '@/lib/supabase/admin';

export async function fetchContentData() {
  const admin = createAdminClient();

  const { data: levels } = await admin
    .from('levels')
    .select('*, grammars(*, memory_items(count), textbook_passages(count))')
    .order('level_number');

  return levels || [];
}

export async function fetchTextbookData() {
  const admin = createAdminClient();

  const { data: passages } = await admin
    .from('textbook_passages')
    .select('*, grammar:grammars(title, level:levels(level_number, title_ko))')
    .order('created_at', { ascending: false });

  return passages || [];
}

export async function fetchStudentsList(academyId: string | null) {
  const admin = createAdminClient();

  const query = admin
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'student')
    .order('full_name');

  if (academyId) {
    query.eq('academy_id', academyId);
  }

  const { data: students } = await query;
  return students || [];
}

export async function fetchTeachersList(academyId: string | null) {
  const admin = createAdminClient();

  const query = admin
    .from('users')
    .select('id, full_name, email, is_active, created_at, academy_id')
    .eq('role', 'teacher')
    .order('full_name');

  if (academyId) {
    query.eq('academy_id', academyId);
  }

  const { data: teachers } = await query;
  return teachers || [];
}
