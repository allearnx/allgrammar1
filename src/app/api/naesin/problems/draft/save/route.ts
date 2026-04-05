import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { problemDraftSaveSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: problemDraftSaveSchema },
  async ({ user, body, supabase }) => {
    const { sheetId, unitId, draftData, answeredCount } = body;

    const row = dbResult(await supabase
      .from('naesin_problem_drafts')
      .upsert(
        {
          student_id: user.id,
          sheet_id: sheetId,
          unit_id: unitId ?? null,
          draft_data: draftData,
          answered_count: answeredCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,sheet_id' }
      )
      .select()
      .single());

    return NextResponse.json(row);
  }
);
