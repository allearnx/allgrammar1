import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { examDateSchema } from '@/lib/api/schemas';

export const GET = createApiHandler(
  {},
  async ({ user, supabase, request }) => {
    const textbookId = request.nextUrl.searchParams.get('textbookId');
    if (!textbookId) return NextResponse.json({ error: 'Missing textbookId' }, { status: 400 });

    const { data } = await supabase
      .from('naesin_exam_dates')
      .select('*')
      .eq('student_id', user.id)
      .eq('textbook_id', textbookId)
      .single();

    return NextResponse.json({ examDate: data });
  }
);

export const POST = createApiHandler(
  { schema: examDateSchema },
  async ({ user, body, supabase }) => {
    const { textbookId, examDate } = body;

    const data = dbResult(await supabase
      .from('naesin_exam_dates')
      .upsert(
        {
          student_id: user.id,
          textbook_id: textbookId,
          exam_date: examDate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,textbook_id' }
      )
      .select()
      .single());

    return NextResponse.json({ examDate: data });
  }
);
