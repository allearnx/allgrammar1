import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { grammarLessonCreateSchema, idSchema } from '@/lib/api/schemas';
import { z } from 'zod';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

const grammarLessonPatchSchema = z.object({
  id: z.string().max(100),
}).passthrough();

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: grammarLessonCreateSchema },
  async ({ body, supabase }) => {
    const data = dbResult(await supabase
      .from('naesin_grammar_lessons')
      .insert({
        unit_id: body.unit_id,
        title: body.title,
        content_type: body.content_type,
        youtube_url: body.youtube_url || null,
        youtube_video_id: body.youtube_video_id || null,
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
  async ({ body, supabase }) => {
    const { id, ...updates } = body as Record<string, unknown>;
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
  async ({ body, supabase }) => {
    dbResult(await supabase.from('naesin_grammar_lessons').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
