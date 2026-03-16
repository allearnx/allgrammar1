import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaVocabBulkSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

// POST — 단어 대량 업로드
export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocaVocabBulkSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    // Get current max sort_order
    const { data: existing } = await supabase
      .from('voca_vocabulary')
      .select('sort_order')
      .eq('day_id', body.day_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const rows = body.items.map((item) => ({
      day_id: body.day_id,
      front_text: item.front_text,
      back_text: item.back_text,
      part_of_speech: item.part_of_speech || null,
      example_sentence: item.example_sentence || null,
      synonyms: item.synonyms || null,
      antonyms: item.antonyms || null,
      spelling_hint: item.spelling_hint || null,
      spelling_answer: item.spelling_answer || null,
      idioms: item.idioms || null,
      sort_order: nextOrder++,
    }));

    const { data, error } = await supabase
      .from('voca_vocabulary')
      .insert(rows)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ count: data?.length || 0, items: data });
  }
);
