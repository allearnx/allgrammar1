import { createClient } from '@/lib/supabase/server';

export interface KokkokAssignment { sheetId: string; studentId: string; studentName: string; bestScore: number | null; assignedAt: string | null }
export interface KokkokSet { id: string; title: string; grammar_id: string; questionCount: number; videoUrl: string | null; assignments: KokkokAssignment[] }

export async function fetchContentData() {
  const supabase = await createClient();

  const { data: levels } = await supabase
    .from('levels')
    .select('*, grammars(*, memory_items(count), textbook_passages(count))')
    .order('level_number');

  return levels || [];
}

/** 내신 콕콕 세트(kind='kokkok')와 학생별 배정 현황 — 콘텐츠 관리 화면용 */
export async function fetchKokkokSets(): Promise<KokkokSet[]> {
  const supabase = await createClient();
  const { data: sets } = await supabase
    .from('naesin_templates')
    .select('id, title, grammar_id, questions, video_url')
    .eq('kind', 'kokkok')
    .not('grammar_id', 'is', null)
    .order('created_at');
  if (!sets || sets.length === 0) return [];

  const ids = sets.map((s) => s.id);
  const { data: sheets } = await supabase
    .from('naesin_problem_sheets')
    .select('id, source_template_id, assigned_student_id, assigned_at')
    .in('source_template_id', ids)
    .not('assigned_student_id', 'is', null);
  const sheetIds = (sheets ?? []).map((s) => s.id);
  const studentIds = [...new Set((sheets ?? []).map((s) => s.assigned_student_id as string))];
  const [{ data: attempts }, { data: students }] = await Promise.all([
    sheetIds.length ? supabase.from('naesin_problem_attempts').select('sheet_id, score').in('sheet_id', sheetIds) : Promise.resolve({ data: [] as { sheet_id: string; score: number }[] }),
    studentIds.length ? supabase.from('users').select('id, full_name').in('id', studentIds) : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ]);
  const best = new Map<string, number>();
  for (const a of attempts ?? []) { const p = best.get(a.sheet_id); if (p == null || a.score > p) best.set(a.sheet_id, a.score); }
  const name = new Map((students ?? []).map((u) => [u.id, u.full_name]));

  return sets.map((s) => ({
    id: s.id,
    title: s.title,
    grammar_id: s.grammar_id as string,
    questionCount: Array.isArray(s.questions) ? s.questions.length : 0,
    videoUrl: (s.video_url as string | null) ?? null,
    assignments: (sheets ?? [])
      .filter((sh) => sh.source_template_id === s.id)
      .map((sh) => ({ sheetId: sh.id, studentId: sh.assigned_student_id as string, studentName: name.get(sh.assigned_student_id as string) ?? '?', bestScore: best.get(sh.id) ?? null, assignedAt: sh.assigned_at })),
  }));
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
