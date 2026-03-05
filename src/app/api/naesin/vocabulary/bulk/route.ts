import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { vocabBulkSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocabBulkSchema },
  async ({ body, supabase }) => {
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

    const { data, error } = await supabase
      .from('naesin_vocabulary')
      .insert(rows)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, count: data?.length || 0 });
  }
);
