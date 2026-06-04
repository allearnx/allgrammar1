import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from './regrade-sheet';
import { logger } from '@/lib/logger';

export interface TemplateSyncResult {
  templateSynced: boolean;
  copiesSynced: number;
}

/**
 * 시트의 questions/answer_key가 변경되면
 * 원본 템플릿 + 다른 복사본에 자동 동기화.
 *
 * correct-answer 라우트는 개별 문항을 동기화하지만,
 * 이 함수는 전체 시트를 일괄 동기화한다.
 */
export async function syncSheetToTemplate(
  sheetId: string,
  questions: unknown,
  answerKey: unknown,
): Promise<TemplateSyncResult> {
  const admin = createAdminClient();

  // 1. source_template_id 조회
  const { data: sheet } = await admin
    .from('naesin_problem_sheets')
    .select('source_template_id')
    .eq('id', sheetId)
    .single();

  if (!sheet?.source_template_id) {
    return { templateSynced: false, copiesSynced: 0 };
  }

  const templateId = sheet.source_template_id;

  // 2. 템플릿 업데이트
  const { error: tmplErr } = await admin
    .from('naesin_templates')
    .update({ questions, answer_key: answerKey })
    .eq('id', templateId);

  if (tmplErr) {
    logger.error('sync_template.update_failed', { templateId, error: tmplErr.message });
    return { templateSynced: false, copiesSynced: 0 };
  }

  // 3. 다른 복사본 조회 (현재 시트 제외)
  const { data: copies } = await admin
    .from('naesin_problem_sheets')
    .select('id')
    .eq('source_template_id', templateId)
    .neq('id', sheetId);

  if (!copies || copies.length === 0) {
    return { templateSynced: true, copiesSynced: 0 };
  }

  // 4. 복사본 일괄 업데이트
  await admin
    .from('naesin_problem_sheets')
    .update({ questions, answer_key: answerKey })
    .eq('source_template_id', templateId)
    .neq('id', sheetId);

  // 5. 복사본 재채점
  await Promise.all(copies.map((c) => regradeSheet(c.id)));

  logger.info('sync_template.synced', {
    templateId,
    sheetId,
    copiesSynced: copies.length,
  });

  return { templateSynced: true, copiesSynced: copies.length };
}
