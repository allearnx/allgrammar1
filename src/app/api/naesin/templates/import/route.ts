import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { templateImportSchema } from '@/lib/api/schemas';
import { sanitizeQuestions, validateBeforeSave } from '@/lib/validation/problem-validator';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: templateImportSchema },
  async ({ user, body, supabase }) => {
    await requireContentPermission(user, supabase);
    const { templateId, targetUnitIds } = body;

    // 1. Fetch template from naesin_templates
    const template = dbResult(await supabase
      .from('naesin_templates')
      .select('*')
      .eq('id', templateId)
      .single());

    // 2. Sanitize + validate before import
    const hasQ = Array.isArray(template.questions) && template.questions.length > 0;
    const { questions: sq, answerKey: sak } = hasQ
      ? sanitizeQuestions(template.questions, template.answer_key)
      : { questions: template.questions || [], answerKey: template.answer_key || [] };

    // 템플릿 import는 검증 오류가 있어도 차단하지 않음 (sanitize만 적용)
    // 기존 템플릿에 빈 정답 등 이슈가 있을 수 있으므로 경고만 기록
    let validationWarnings: string[] = [];
    if (hasQ) {
      const validation = validateBeforeSave(sq);
      if (!validation.valid) {
        validationWarnings = validation.errors.map((e) => e.message);
        console.warn(`[template-import] ${template.title}: ${validationWarnings.join(', ')}`);
      }
    }

    // 3. Build rows for each target unit
    const rows = targetUnitIds.map((unitId: string) => ({
      unit_id: unitId,
      title: template.title,
      mode: template.mode,
      questions: sq,
      answer_key: sak,
      category: template.category || 'problem',
      source_template_id: templateId,
    }));

    // 4. Bulk insert into naesin_problem_sheets
    const inserted = dbResult(await supabase
      .from('naesin_problem_sheets')
      .insert(rows)
      .select()) ?? [];

    return NextResponse.json({ count: inserted.length, sheets: inserted, ...(validationWarnings.length > 0 && { warnings: validationWarnings }) });
  }
);
