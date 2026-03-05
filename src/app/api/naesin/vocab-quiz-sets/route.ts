import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const unitId = request.nextUrl.searchParams.get('unitId');
  if (!unitId) return NextResponse.json({ error: 'Missing unitId' }, { status: 400 });

  const { data, error } = await supabase
    .from('naesin_vocab_quiz_sets')
    .select('*')
    .eq('unit_id', unitId)
    .order('set_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check teacher role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!userData || !['teacher', 'admin', 'boss'].includes(userData.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { unitId, title, vocabIds } = await request.json();
  if (!unitId || !title || !vocabIds?.length) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Get next set_order
  const { data: existing } = await supabase
    .from('naesin_vocab_quiz_sets')
    .select('set_order')
    .eq('unit_id', unitId)
    .order('set_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.set_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('naesin_vocab_quiz_sets')
    .insert({
      unit_id: unitId,
      title,
      set_order: nextOrder,
      vocab_ids: vocabIds,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!userData || !['teacher', 'admin', 'boss'].includes(userData.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase
    .from('naesin_vocab_quiz_sets')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
