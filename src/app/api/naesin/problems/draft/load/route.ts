import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';

export const GET = createApiHandler(
  {},
  async ({ user, supabase, request }) => {
    const sheetId = request.nextUrl.searchParams.get('sheetId');
    if (!sheetId) {
      return NextResponse.json({ error: 'Missing sheetId' }, { status: 400 });
    }

    const { data } = await supabase
      .from('naesin_problem_drafts')
      .select('*')
      .eq('student_id', user.id)
      .eq('sheet_id', sheetId)
      .single();

    return NextResponse.json(data);
  }
);
