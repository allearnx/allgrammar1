import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { wrongAnswerCreateSchema, wrongAnswerPatchSchema } from '@/lib/api/schemas';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 학생 본인의 누락된 문제풀이 오답 자동 복구.
 */
async function autoBackfillForStudent(studentId: string) {
  const admin = createAdminClient();

  const { data: attempts } = await admin
    .from('naesin_problem_attempts')
    .select('id, sheet_id, wrong_answers')
    .eq('student_id', studentId)
    .not('wrong_answers', 'eq', '[]');

  if (!attempts || attempts.length === 0) return;

  const { data: existing } = await admin
    .from('naesin_wrong_answers')
    .select('sheet_id')
    .eq('student_id', studentId)
    .not('sheet_id', 'is', null);

  const existingSet = new Set((existing || []).map((e) => e.sheet_id));
  const missing = attempts.filter((a) => !existingSet.has(a.sheet_id));
  if (missing.length === 0) return;

  const sheetIds = [...new Set(missing.map((a) => a.sheet_id))];
  const { data: sheets } = await admin
    .from('naesin_problem_sheets')
    .select('id, unit_id, mode, category, questions')
    .in('id', sheetIds);

  const sheetMap = new Map((sheets || []).map((s) => [s.id, s]));
  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  for (const attempt of missing) {
    if (seen.has(attempt.sheet_id)) continue;
    seen.add(attempt.sheet_id);
    const sheet = sheetMap.get(attempt.sheet_id);
    if (!sheet) continue;
    const wrongAnswers = attempt.wrong_answers as {
      number: number; userAnswer: string | number;
      correctAnswer: string | number; question?: string;
    }[];
    if (!wrongAnswers || wrongAnswers.length === 0) continue;
    const questions = (sheet.questions || []) as { options?: string[]; explanation?: string; imageUrl?: string }[];
    for (const wa of wrongAnswers) {
      const idx = wa.number - 1;
      const q = questions[idx];
      rows.push({
        student_id: studentId, unit_id: sheet.unit_id,
        stage: sheet.category === 'mock_exam' ? 'mockExam' : 'problem', source_type: sheet.mode || 'interactive',
        question_data: { ...wa, ...(q?.options ? { options: q.options } : {}), ...(q?.explanation ? { explanation: q.explanation } : {}), ...(q?.imageUrl ? { imageUrl: q.imageUrl } : {}) },
        sheet_id: attempt.sheet_id,
        round: 1,
      });
    }
  }

  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i += 500) {
      await admin.from('naesin_wrong_answers').insert(rows.slice(i, i + 500));
    }
  }
}

export const GET = createApiHandler(
  {},
  async ({ user, supabase, request }) => {
    const unitId = request.nextUrl.searchParams.get('unitId');
    const resolved = request.nextUrl.searchParams.get('resolved');

    // 누락된 문제풀이 오답 자동 복구
    await autoBackfillForStudent(user.id);

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
      const allUnitIds = [...new Set((data as { unit_id: string | null }[]).map((d) => d.unit_id).filter(Boolean))] as string[];
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
      // 교과서 레벨 시험 오답: sheet에서 textbook 정보 가져오기
      const textbookLevelItems = (data as Record<string, unknown>[]).filter((d) => !d.unit_id && d.sheet_id);
      if (textbookLevelItems.length > 0) {
        const sheetIds = [...new Set(textbookLevelItems.map((d) => d.sheet_id as string))];
        const { data: sheets } = await supabase
          .from('naesin_problem_sheets')
          .select('id, textbook_id, title, textbook:naesin_textbooks(id, display_name)')
          .in('id', sheetIds);
        const sheetMap = new Map((sheets || []).map((s) => [s.id, s]));
        for (const item of textbookLevelItems) {
          const sheetInfo = sheetMap.get(item.sheet_id as string);
          if (sheetInfo?.textbook) {
            item.textbook_info = sheetInfo.textbook;
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
    const { unitId, stage, sourceType, wrongAnswers, round } = body;

    const rows = wrongAnswers.map((wa: unknown) => ({
      student_id: user.id,
      unit_id: unitId,
      stage,
      source_type: sourceType,
      question_data: wa,
      round: round ?? 1,
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
