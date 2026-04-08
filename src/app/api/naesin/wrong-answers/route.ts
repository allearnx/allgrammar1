import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { wrongAnswerCreateSchema, wrongAnswerPatchSchema } from '@/lib/api/schemas';

export const GET = createApiHandler(
  {},
  async ({ user, supabase, request }) => {
    const unitId = request.nextUrl.searchParams.get('unitId');
    const resolved = request.nextUrl.searchParams.get('resolved');

    let query = supabase
      .from('naesin_wrong_answers')
      .select('*, sheet:naesin_problem_sheets(id, title)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (unitId) {
      query = query.eq('unit_id', unitId);
    } else {
      query = query.limit(500);
    }

    if (resolved !== null && resolved !== undefined) {
      query = query.eq('resolved', resolved === 'true');
    }

    const data = dbResult(await query);

    // When fetching all (no unitId), enrich with unit/textbook info
    if (!unitId) {
      const allUnitIds = [...new Set((data as { unit_id: string }[]).map((d) => d.unit_id))];
      if (allUnitIds.length > 0) {
        const { data: units } = await supabase
          .from('naesin_units')
          .select('id, unit_number, title, textbook:naesin_textbooks(id, display_name)')
          .in('id', allUnitIds);
        const unitMap = new Map((units || []).map((u) => [u.id, u]));
        for (const item of data as Record<string, unknown>[]) {
          const unitInfo = unitMap.get(item.unit_id as string);
          if (unitInfo) {
            item.unit_info = { unit_number: unitInfo.unit_number, title: unitInfo.title };
            item.textbook_info = unitInfo.textbook;
          }
        }
      }
    }

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

    dbResult(await supabase
      .from('naesin_wrong_answers')
      .insert(rows));
    return NextResponse.json({ success: true, count: rows.length });
  }
);

export const PATCH = createApiHandler(
  { schema: wrongAnswerPatchSchema },
  async ({ user, body, supabase }) => {
    const { id, resolved } = body;

    dbResult(await supabase
      .from('naesin_wrong_answers')
      .update({ resolved: resolved ?? true })
      .eq('id', id)
      .eq('student_id', user.id));
    return NextResponse.json({ success: true });
  }
);
