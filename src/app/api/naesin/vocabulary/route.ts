import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { vocabCreateSchema, vocabPatchSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: vocabCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const data = dbResult(await supabase
      .from('naesin_vocabulary')
      .insert({
        unit_id: body.unit_id,
        front_text: body.front_text,
        back_text: body.back_text,
        part_of_speech: body.part_of_speech || null,
        example_sentence: body.example_sentence || null,
        synonyms: body.synonyms || null,
        antonyms: body.antonyms || null,
        spelling_answer: body.front_text,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single());
    return NextResponse.json(data);
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: vocabPatchSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { id, ...fields } = body;

    const allowed = ['front_text', 'back_text', 'part_of_speech', 'example_sentence', 'synonyms', 'antonyms'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in fields) updates[key] = (fields as Record<string, unknown>)[key] || null;
    }
    if (updates.front_text) updates.spelling_answer = updates.front_text;

    const data = dbResult(await supabase
      .from('naesin_vocabulary')
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
    dbResult(await supabase.from('naesin_vocabulary').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
