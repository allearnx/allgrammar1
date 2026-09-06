import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { vocabBulkSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocabBulkSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { unit_id, items } = body;

    // 재추출 후 다시 저장해도 안전하도록, 단원에 이미 있는 단어는 건너뛴다.
    // (없으면 같은 파일 재업로드 시 기존 단어가 통째로 중복됨)
    const { data: existing } = await supabase
      .from('naesin_vocabulary')
      .select('front_text, sort_order')
      .eq('unit_id', unit_id);
    const existingKeys = new Set(
      (existing || []).map((v) => v.front_text.toLowerCase().trim()),
    );
    const sortBase = (existing || []).reduce((max, v) => Math.max(max, (v.sort_order ?? -1) + 1), 0);

    const newItems = items.filter(
      (item) => !existingKeys.has((item.front_text || '').toLowerCase().trim()),
    );
    const skipped = items.length - newItems.length;

    if (newItems.length === 0) {
      return NextResponse.json({ success: true, count: 0, skipped });
    }

    const rows = newItems.map((item, idx) => ({
      unit_id,
      front_text: item.front_text || '',
      back_text: item.back_text || '',
      part_of_speech: item.part_of_speech || null,
      example_sentence: item.example_sentence || null,
      synonyms: item.synonyms || null,
      antonyms: item.antonyms || null,
      spelling_answer: item.front_text || '',
      sort_order: sortBase + idx,
    }));

    const data = dbResult(await supabase
      .from('naesin_vocabulary')
      .insert(rows)
      .select());
    return NextResponse.json({ success: true, count: data?.length || 0, skipped });
  }
);
