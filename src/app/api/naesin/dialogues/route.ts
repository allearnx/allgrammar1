import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, dbResult } from '@/lib/api';
import { idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

const dialogueCreateSchema = z.object({
  unit_id: z.string().max(100),
  title: z.string().max(200),
  sentences: z.array(z.object({
    original: z.string(),
    korean: z.string(),
    speaker: z.string().optional(),
  })).min(1),
  sort_order: z.number().nullish(),
});

const dialogueUpdateSchema = z.object({
  id: z.string().max(100),
  title: z.string().max(200).optional(),
  sentences: z.array(z.object({
    original: z.string(),
    korean: z.string(),
    speaker: z.string().optional(),
  })).min(1).optional(),
  sort_order: z.number().nullish(),
});

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: dialogueCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const data = dbResult(await supabase
      .from('naesin_dialogues')
      .insert({
        unit_id: body.unit_id,
        title: body.title,
        sentences: body.sentences,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single());
    return NextResponse.json(data);
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: dialogueUpdateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const updates: Record<string, unknown> = {};
    if (body.title) updates.title = body.title;
    if (body.sentences) updates.sentences = body.sentences;
    if (body.sort_order !== undefined && body.sort_order !== null) updates.sort_order = body.sort_order;

    const data = dbResult(await supabase
      .from('naesin_dialogues')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single());
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    dbResult(await supabase.from('naesin_dialogues').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
