import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { lastReviewCreateSchema, idSchema } from '@/lib/api/schemas';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const GET = createApiHandler(
  {},
  async ({ supabase, request }) => {
    const unitId = request.nextUrl.searchParams.get('unitId');
    if (!unitId) return NextResponse.json({ error: 'Missing unitId' }, { status: 400 });

    const data = dbResult(await supabase
      .from('naesin_last_review_content')
      .select('*')
      .eq('unit_id', unitId)
      .order('sort_order'));
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: lastReviewCreateSchema },
  async ({ body, supabase }) => {
    const { unitId, contentType, title, youtubeUrl, youtubeVideoId, pdfUrl, textContent } = body;

    const data = dbResult(await supabase
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
      .single());
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase }) => {
    dbResult(await supabase
      .from('naesin_last_review_content')
      .delete()
      .eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
