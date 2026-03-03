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

  const body = await request.json();
  const { unit_id, front_text, back_text } = body;
  if (!unit_id || !front_text || !back_text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('naesin_vocabulary')
    .insert({
      unit_id,
      front_text,
      back_text,
      quiz_options: body.quiz_options || null,
      quiz_correct_index: body.quiz_correct_index ?? null,
      spelling_hint: body.spelling_hint || null,
      spelling_answer: body.spelling_answer || null,
      sort_order: body.sort_order || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const user = await requireTeacherPlus(supabase);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase.from('naesin_vocabulary').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
