import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { templateImportSchema } from '@/lib/api/schemas';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: templateImportSchema },
  async ({ body, supabase }) => {
    const { templateId, targetUnitIds } = body;

    // 1. Fetch template from naesin_templates
    const template = dbResult(await supabase
      .from('naesin_templates')
      .select('*')
      .eq('id', templateId)
      .single());

    // 2. Build rows for each target unit
    const rows = targetUnitIds.map((unitId: string) => ({
      unit_id: unitId,
      title: template.title,
      mode: template.mode,
      questions: template.questions || [],
      answer_key: template.answer_key || [],
      category: template.category || 'problem',
      source_template_id: templateId,
    }));

    // 3. Bulk insert into naesin_problem_sheets
    const inserted = dbResult(await supabase
      .from('naesin_problem_sheets')
      .insert(rows)
      .select()) ?? [];

    return NextResponse.json({ count: inserted.length, sheets: inserted });
  }
);
