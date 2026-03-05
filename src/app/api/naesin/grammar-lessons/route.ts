import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { grammarLessonCreateSchema, idSchema } from '@/lib/api/schemas';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: grammarLessonCreateSchema },
  async ({ body, supabase }) => {
    const { data, error } = await supabase
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
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase }) => {
    const { error } = await supabase.from('naesin_grammar_lessons').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
