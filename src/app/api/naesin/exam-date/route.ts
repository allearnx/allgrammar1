import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { textbookId, examDate } = await request.json();
  if (!textbookId || !examDate) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data, error } = await supabase
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
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ examDate: data });
}
