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
  const { unit_id, title, original_text, korean_translation } = body;
  if (!unit_id || !title || !original_text || !korean_translation) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('naesin_passages')
    .insert({
      unit_id,
      title,
      original_text,
      korean_translation,
      blanks_easy: body.blanks_easy || null,
      blanks_medium: body.blanks_medium || null,
      blanks_hard: body.blanks_hard || null,
      sentences: body.sentences || null,
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

  const { error } = await supabase.from('naesin_passages').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
