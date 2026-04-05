import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { problemCopySchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: problemCopySchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { sourceSheetId, targetUnitIds, newTitle } = body;

    // 1. Fetch source sheet
    const source = dbResult(await supabase
      .from('naesin_problem_sheets')
      .select('*')
      .eq('id', sourceSheetId)
      .single());

    // 2. Build rows for each target unit
    const rows = targetUnitIds.map((unitId: string) => ({
      unit_id: unitId,
      title: newTitle?.trim() || source.title,
      mode: source.mode,
      questions: source.questions || [],
      answer_key: source.answer_key || [],
      category: source.category || 'problem',
      pdf_url: source.pdf_url || null,
    }));

    // 3. Bulk insert
    const inserted = dbResult(await supabase
      .from('naesin_problem_sheets')
      .insert(rows)
      .select()) ?? [];

    return NextResponse.json({ count: inserted.length, sheets: inserted });
  }
);
