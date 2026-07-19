import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaVocabBulkSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { filterVocabItems } from '@/lib/voca/vocab-guard';

// POST — 단어 대량 업로드
export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocaVocabBulkSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);

    // 오염 방지: AI 응답 문장 등 표제어 형식이 아닌 항목은 걸러내고 저장
    const { valid: items, skipped } = filterVocabItems(body.items);
    if (items.length === 0) {
      return NextResponse.json(
        { error: '유효한 단어가 없습니다. 표제어 형식을 확인해주세요.', skipped },
        { status: 400 },
      );
    }

    // Get current max sort_order
    const { data: existing } = await supabase
      .from('voca_vocabulary')
      .select('sort_order')
      .eq('day_id', body.day_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const rows = items.map((item) => ({
      day_id: body.day_id,
      front_text: item.front_text,
      back_text: item.back_text,
      part_of_speech: item.part_of_speech || null,
      example_sentence: item.example_sentence || null,
      example_sentence_ko: item.example_sentence_ko || null,
      exam_source: item.exam_source || null,
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
    return NextResponse.json({ count: data?.length || 0, items: data, skipped });
  }
);
