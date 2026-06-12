import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { textbookVideoCreateSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { extractVideoId } from '@/lib/utils/youtube';
import { createAdminClient } from '@/lib/supabase/admin';
import { cached, TTL } from '@/lib/cache/server-cache';
import { cacheTags } from '@/lib/cache/tags';
import { invalidateUnitContent } from '@/lib/cache/invalidate';
import { NAESIN_TEXTBOOK_VIDEOS_COLUMNS } from '@/types/naesin';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

const getCachedTextbookVideos = cached(
  async (unitId: string) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('naesin_textbook_videos')
      .select(NAESIN_TEXTBOOK_VIDEOS_COLUMNS)
      .eq('unit_id', unitId)
      .order('sort_order');
    return data || [];
  },
  'textbook-videos',
  TTL.CONTENT,
  (unitId) => [cacheTags.unitContent(unitId)],
);

export const GET = createApiHandler(
  {},
  async ({ request }) => {
    const unitId = request.nextUrl.searchParams.get('unitId');
    if (!unitId) return NextResponse.json({ error: 'Missing unitId' }, { status: 400 });

    const data = await getCachedTextbookVideos(unitId);
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
    invalidateUnitContent(unitId);
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    // 삭제 전 unitId 조회 (캐시 무효화용)
    const { data: video } = await supabase
      .from('naesin_textbook_videos')
      .select('unit_id')
      .eq('id', body.id)
      .single();

    dbResult(await supabase
      .from('naesin_textbook_videos')
      .delete()
      .eq('id', body.id));

    if (video?.unit_id) invalidateUnitContent(video.unit_id);
    return NextResponse.json({ success: true });
  }
);
