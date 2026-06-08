import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { wrongAnswerCreateSchema, wrongAnswerPatchSchema } from '@/lib/api/schemas';

// NOTE: autoBackfill 제거 — submit/route.ts에서 오답 저장이 실시간으로 처리됨.
// 레거시 누락 데이터는 별도 마이그레이션으로 처리.

export const GET = createApiHandler(
  {},
  async ({ user, supabase, request }) => {
    const unitId = request.nextUrl.searchParams.get('unitId');
    const resolved = request.nextUrl.searchParams.get('resolved');

    let query = supabase
      .from('naesin_wrong_answers')
      .select('id, student_id, unit_id, stage, source_type, question_data, resolved, sheet_id, created_at, round, sheet:naesin_problem_sheets(id, title)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (unitId) {
      query = query.eq('unit_id', unitId).limit(200);
    } else {
      query = query.limit(200);
    }

    if (resolved !== null && resolved !== undefined) {
      query = query.eq('resolved', resolved === 'true');
    }

    const data = dbResult(await query);

    // When fetching all (no unitId), enrich with unit/textbook info + progress
    if (!unitId) {
      const allUnitIds = [...new Set((data as { unit_id: string | null }[]).map((d) => d.unit_id).filter(Boolean))] as string[];
      if (allUnitIds.length > 0) {
        // unit/textbook 정보 + 학생 진도 + 시험 배정을 병렬 조회
        const [unitsResult, progressResult, examResult] = await Promise.all([
          supabase
            .from('naesin_units')
            .select('id, unit_number, title, textbook:naesin_textbooks(id, display_name)')
            .in('id', allUnitIds),
          supabase
            .from('naesin_student_progress')
            .select('unit_id, problem_completed, mock_exam_completed')
            .eq('student_id', user.id)
            .in('unit_id', allUnitIds),
          supabase
            .from('naesin_exam_assignments')
            .select('unit_ids')
            .eq('student_id', user.id),
        ]);

        const unitMap = new Map((unitsResult.data || []).map((u) => [u.id, u]));
        const progressMap = new Map((progressResult.data || []).map((p) => [p.unit_id, p]));

        // 시험차수별 unit_ids 그룹 → 같은 시험 범위의 과가 전부 완료돼야 completed
        const examRounds = (examResult.data || []).map((e) => e.unit_ids as string[]).filter(Boolean);
        const completedUnitIds = new Set<string>();

        for (const roundUnitIds of examRounds) {
          const allDone = roundUnitIds.every((uid) => {
            const p = progressMap.get(uid);
            return p?.problem_completed && p?.mock_exam_completed;
          });
          if (allDone) {
            for (const uid of roundUnitIds) completedUnitIds.add(uid);
          }
        }

        for (const item of data as Record<string, unknown>[]) {
          const uid = item.unit_id as string;
          const unitInfo = unitMap.get(uid);
          if (unitInfo) {
            item.unit_info = { unit_number: unitInfo.unit_number, title: unitInfo.title };
            item.textbook_info = unitInfo.textbook;
          }
          item.unit_completed = completedUnitIds.has(uid);
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
