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

    if (hasQ) {
      const validation = validateBeforeSave(sq);
      if (!validation.valid) {
        return NextResponse.json(
          { error: '템플릿 데이터에 오류가 있습니다.', issues: validation.errors },
          { status: 422 },
        );
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

    return NextResponse.json({ count: inserted.length, sheets: inserted });
  }
);
