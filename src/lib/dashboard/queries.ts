import { createClient } from '@/lib/supabase/server';

export async function fetchContentData() {
  const supabase = await createClient();

  const { data: levels } = await supabase
    .from('levels')
    .select('*, grammars(*, memory_items(count), textbook_passages(count))')
    .order('level_number');

  return levels || [];
}

export async function fetchTextbookData() {
  const supabase = await createClient();

  const { data: passages } = await supabase
    .from('textbook_passages')
    .select('*, grammar:grammars(title, level:levels(level_number, title_ko))')
    .order('created_at', { ascending: false });

  return passages || [];
}

export async function fetchStudentsList(academyId: string | null) {
  if (!academyId) return [];

  const supabase = await createClient();

  const { data: students } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'student')
    .eq('academy_id', academyId)
    .order('full_name');

  return students || [];
}

export async function fetchTeachersList(academyId: string | null) {
  if (!academyId) return [];

  const supabase = await createClient();

  const { data: teachers } = await supabase
    .from('users')
    .select('id, full_name, email, is_active, created_at, academy_id')
    .eq('role', 'teacher')
    .eq('academy_id', academyId)
    .order('full_name');

  return teachers || [];
}
