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

  const { textbook_id, unit_number, title, sort_order } = await request.json();
  if (!textbook_id || !unit_number || !title) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('naesin_units')
    .insert({ textbook_id, unit_number, title, sort_order: sort_order || 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const user = await requireTeacherPlus(supabase);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data, error } = await supabase
    .from('naesin_units')
    .update(updates)
    .eq('id', id)
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

  const { error } = await supabase.from('naesin_units').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
