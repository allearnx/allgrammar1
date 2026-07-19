import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaDaysWithVocabSchema } from '@/lib/api/schemas';
import { invalidateVocaContent } from '@/lib/cache/invalidate';
import { filterVocabItems } from '@/lib/voca/vocab-guard';

// POST — Day + 단어 일괄 생성 (PDF 대량 추출용)
export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocaDaysWithVocabSchema },
  async ({ body, supabase }) => {
    const { book_id, words_per_day } = body;

    // 오염 방지: AI 응답 문장 등 표제어 형식이 아닌 항목은 걸러내고 저장
    const { valid: items, skipped } = filterVocabItems(body.items);
    if (items.length === 0) {
      return NextResponse.json(
        { error: '유효한 단어가 없습니다. 추출 결과를 확인해주세요.', skipped },
        { status: 400 },
      );
    }

    // 기존 max day_number 조회
    const { data: existing } = await supabase
      .from('voca_days')
      .select('day_number, sort_order')
      .eq('book_id', book_id)
      .order('day_number', { ascending: false })
      .limit(1);

    const startDayNumber = (existing?.[0]?.day_number ?? 0) + 1;
    const startSortOrder = (existing?.[0]?.sort_order ?? 0) + 1;

    // 단어를 words_per_day 단위로 분할
    const chunks: (typeof items)[] = [];
    for (let i = 0; i < items.length; i += words_per_day) {
      chunks.push(items.slice(i, i + words_per_day));
    }

    const createdDays = [];

    for (let i = 0; i < chunks.length; i++) {
      const dayNumber = startDayNumber + i;

      // Day 생성
      const { data: day, error: dayError } = await supabase
        .from('voca_days')
        .insert({
          book_id,
          day_number: dayNumber,
          title: `Day ${dayNumber}`,
          sort_order: startSortOrder + i,
        })
        .select()
        .single();

      if (dayError) {
        return NextResponse.json({ error: dayError.message }, { status: 400 });
      }

      // 해당 Day에 단어 insert
      const rows = chunks[i].map((item, idx) => ({
        day_id: day.id,
        front_text: item.front_text,
        back_text: item.back_text,
        part_of_speech: item.part_of_speech || null,
        example_sentence: item.example_sentence || null,
        example_sentence_ko: item.example_sentence_ko || null,
        exam_source: item.exam_source || null,
        synonyms: item.synonyms || null,
        antonyms: item.antonyms || null,
        spelling_hint: item.spelling_hint || null,
        spelling_answer: item.spelling_answer || item.front_text,
        idioms: item.idioms || null,
        sort_order: idx,
      }));

      const { error: vocabError } = await supabase
        .from('voca_vocabulary')
        .insert(rows);

      if (vocabError) {
        return NextResponse.json({ error: vocabError.message }, { status: 400 });
      }

      createdDays.push({ ...day, wordCount: chunks[i].length });
    }

    // GET /api/voca/days?bookId=...는 5분 캐시(TTL.CONTENT) — 무효화 안 하면
    // 방금 만든 Day가 모달 닫고 목록 새로고침해도 최대 5분간 안 보임(리포트된 버그).
    invalidateVocaContent(book_id);

    return NextResponse.json({ days: createdDays, totalWords: items.length, skipped });
  }
);
