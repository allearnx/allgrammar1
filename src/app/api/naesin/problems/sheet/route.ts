import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';

/** Fetch a single full problem sheet (with questions + answer_key) */
export const GET = createApiHandler(
  {},
  async ({ supabase, request }) => {
    const sheetId = request.nextUrl.searchParams.get('id');
    if (!sheetId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const data = dbResult(await supabase
      .from('naesin_problem_sheets')
      .select('*')
      .eq('id', sheetId)
      .single());

    return NextResponse.json(data);
  }
);
