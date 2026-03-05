import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const unitId = request.nextUrl.searchParams.get('unitId');
  if (!unitId) return NextResponse.json({ error: 'Missing unitId' }, { status: 400 });

  const resolved = request.nextUrl.searchParams.get('resolved');

  let query = supabase
    .from('naesin_wrong_answers')
    .select('*')
    .eq('student_id', user.id)
    .eq('unit_id', unitId)
    .order('created_at', { ascending: false });

  if (resolved !== null && resolved !== undefined) {
    query = query.eq('resolved', resolved === 'true');
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { unitId, stage, sourceType, wrongAnswers } = await request.json();
  if (!unitId || !stage || !sourceType || !wrongAnswers?.length) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const rows = wrongAnswers.map((wa: unknown) => ({
    student_id: user.id,
    unit_id: unitId,
    stage,
    source_type: sourceType,
    question_data: wa,
  }));

  const { error } = await supabase
    .from('naesin_wrong_answers')
    .insert(rows);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, count: rows.length });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, resolved } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase
    .from('naesin_wrong_answers')
    .update({ resolved: resolved ?? true })
    .eq('id', id)
    .eq('student_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
