import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { problemDraftSaveSchema } from '@/lib/api/schemas';
import { logger } from '@/lib/logger';

export const POST = createApiHandler(
  { schema: problemDraftSaveSchema },
  async ({ user, body, supabase }) => {
    const { sheetId, unitId, draftData, answeredCount } = body;

    const { data, error } = await supabase
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
      .single();

    if (error) {
      // Draft save is best-effort — return 409 instead of 500 to avoid noisy alerts
      logger.warn('draft.save_failed', { sheetId, userId: user.id, error: error.message });
      return NextResponse.json(
        { error: '임시 저장에 실패했습니다.', detail: error.message },
        { status: 409 },
      );
    }

    return NextResponse.json(data);
  }
);
