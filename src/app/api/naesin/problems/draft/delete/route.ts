import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { problemDraftDeleteSchema } from '@/lib/api/schemas';

export const DELETE = createApiHandler(
  { schema: problemDraftDeleteSchema, hasBody: true },
  async ({ user, body, supabase }) => {
    await supabase
      .from('naesin_problem_drafts')
      .delete()
      .eq('student_id', user.id)
      .eq('sheet_id', body.sheetId);

    return NextResponse.json({ success: true });
  }
);
