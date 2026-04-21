import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

export const maxDuration = 300;

/**
 * 모든 문제 시트를 일괄 재채점한다.
 * - attempts JSONB 동기화
 * - naesin_wrong_answers stage 정리
 * - orphan 레코드 제거
 */
export const POST = createApiHandler(
  { roles: ['boss'] },
  async () => {
    const admin = createAdminClient();

    // 시도가 있는 시트만 조회
    const { data: sheetRows } = await admin
      .from('naesin_problem_attempts')
      .select('sheet_id');

    const sheetIds = [...new Set((sheetRows || []).map((r) => r.sheet_id))];

    if (sheetIds.length === 0) {
      return NextResponse.json({ message: 'No sheets with attempts', total: 0 });
    }

    let totalAttempts = 0;
    let totalChanged = 0;
    const errors: string[] = [];

    for (const sheetId of sheetIds) {
      try {
        const result = await regradeSheet(sheetId);
        totalAttempts += result.total;
        totalChanged += result.changed;
      } catch (e) {
        errors.push(`${sheetId}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return NextResponse.json({
      message: 'Regrade complete',
      sheetsProcessed: sheetIds.length,
      totalAttempts,
      totalChanged,
      errors: errors.length > 0 ? errors : undefined,
    });
  }
);
