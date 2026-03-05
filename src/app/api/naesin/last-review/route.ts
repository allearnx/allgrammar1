import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const unitId = request.nextUrl.searchParams.get('unitId');
  if (!unitId) return NextResponse.json({ error: 'Missing unitId' }, { status: 400 });

  const { data, error } = await supabase
    .from('naesin_last_review_content')
    .select('*')
    .eq('unit_id', unitId)
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!userData || !['teacher', 'admin', 'boss'].includes(userData.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { unitId, contentType, title, youtubeUrl, youtubeVideoId, pdfUrl, textContent } = await request.json();
  if (!unitId || !contentType || !title) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('naesin_last_review_content')
    .insert({
      unit_id: unitId,
      content_type: contentType,
      title,
      youtube_url: youtubeUrl || null,
      youtube_video_id: youtubeVideoId || null,
      pdf_url: pdfUrl || null,
      text_content: textContent || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase
    .from('naesin_last_review_content')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
