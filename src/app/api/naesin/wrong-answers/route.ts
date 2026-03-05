import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { wrongAnswerCreateSchema, wrongAnswerPatchSchema } from '@/lib/api/schemas';

export const GET = createApiHandler(
  {},
  async ({ user, supabase, request }) => {
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
);

export const POST = createApiHandler(
  { schema: wrongAnswerCreateSchema },
  async ({ user, body, supabase }) => {
    const { unitId, stage, sourceType, wrongAnswers } = body;

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
);

export const PATCH = createApiHandler(
  { schema: wrongAnswerPatchSchema },
  async ({ user, body, supabase }) => {
    const { id, resolved } = body;

    const { error } = await supabase
      .from('naesin_wrong_answers')
      .update({ resolved: resolved ?? true })
      .eq('id', id)
      .eq('student_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
