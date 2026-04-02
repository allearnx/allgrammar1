import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { textbookVideoCreateSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { extractVideoId } from '@/lib/utils/youtube';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const GET = createApiHandler(
  {},
  async ({ supabase, request }) => {
    const unitId = request.nextUrl.searchParams.get('unitId');
    if (!unitId) return NextResponse.json({ error: 'Missing unitId' }, { status: 400 });

    const data = dbResult(await supabase
      .from('naesin_textbook_videos')
      .select('*')
      .eq('unit_id', unitId)
      .order('sort_order'));
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: textbookVideoCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { unitId, title, youtubeUrl } = body;
    const videoId = extractVideoId(youtubeUrl) || null;

    const data = dbResult(await supabase
      .from('naesin_textbook_videos')
      .insert({
        unit_id: unitId,
        title,
        youtube_url: youtubeUrl || null,
        youtube_video_id: videoId,
      })
      .select()
      .single());
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    dbResult(await supabase
      .from('naesin_textbook_videos')
      .delete()
      .eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
