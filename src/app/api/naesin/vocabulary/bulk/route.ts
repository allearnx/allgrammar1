import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { vocabBulkSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocabBulkSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { unit_id, items } = body;

    const rows = items.map((item, idx) => ({
      unit_id,
      front_text: item.front_text || '',
      back_text: item.back_text || '',
      part_of_speech: item.part_of_speech || null,
      example_sentence: item.example_sentence || null,
      synonyms: item.synonyms || null,
      antonyms: item.antonyms || null,
      spelling_answer: item.front_text || '',
      sort_order: idx,
    }));

    const data = dbResult(await supabase
      .from('naesin_vocabulary')
      .insert(rows)
      .select());
    return NextResponse.json({ success: true, count: data?.length || 0 });
  }
);
