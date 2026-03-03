import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireTeacherPlus(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['teacher', 'admin', 'boss'].includes(profile.role)) return null;
  return user;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await requireTeacherPlus(supabase);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { unit_id, items } = await request.json();
  if (!unit_id || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Missing unit_id or items array' }, { status: 400 });
  }

  const rows = items.map((item: Record<string, unknown>, idx: number) => ({
    unit_id,
    front_text: item.front_text || '',
    back_text: item.back_text || '',
    quiz_options: item.quiz_options || null,
    quiz_correct_index: item.quiz_correct_index ?? null,
    spelling_hint: item.spelling_hint || null,
    spelling_answer: item.spelling_answer || null,
    sort_order: idx,
  }));

  const { data, error } = await supabase
    .from('naesin_vocabulary')
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, count: data?.length || 0 });
}
