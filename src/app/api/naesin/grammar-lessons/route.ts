import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { grammarLessonCreateSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { extractVideoId } from '@/lib/utils/youtube';
import { z } from 'zod';

/** URL·"ID?si=..." 등 어떤 형태로 와도 순수 11자 비디오 ID로 정규화.
 *  꼬리가 남으면 YT 플레이어에 잘못된 ID가 전달돼 영상이 안 뜸 (실사고: ?si= 7건). */
function normalizeVideoId(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null;
  const m = value.match(/^([A-Za-z0-9_-]{11})(?:[?&]|$)/);
  if (m) return m[1];
  return extractVideoId(value) ?? (value.split(/[?&]/)[0] || null);
}

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

const grammarLessonPatchSchema = z.object({
  id: z.string().max(100),
}).passthrough();

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: grammarLessonCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const data = dbResult(await supabase
      .from('naesin_grammar_lessons')
      .insert({
        unit_id: body.unit_id,
        title: body.title,
        content_type: body.content_type,
        youtube_url: body.youtube_url || null,
        youtube_video_id: normalizeVideoId(body.youtube_video_id),
        video_duration_seconds: body.video_duration_seconds || null,
        text_content: body.text_content || null,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single());
    return NextResponse.json(data);
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: grammarLessonPatchSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { id, ...updates } = body as Record<string, unknown>;
    if ('youtube_video_id' in updates) {
      updates.youtube_video_id = normalizeVideoId(updates.youtube_video_id);
    }
    const data = dbResult(await supabase
      .from('naesin_grammar_lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single());
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    dbResult(await supabase.from('naesin_grammar_lessons').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
