import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
import { parseAiJsonArray } from '@/lib/ai-json';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120;

const anthropic = new Anthropic();

const PROMPT_KO = `아래 영어 단어 목록에 대해 유의어, 반의어, 관련 숙어, 예문을 생성해주세요.

규칙:
- 각 단어의 id를 그대로 유지
- 유의어(s): 쉼표로 구분, 없으면 null
- 반의어(a): 쉼표로 구분, 없으면 null
- 숙어(i): 관련 숙어 배열, 없으면 null
- 예문(e): 반드시 모든 단어에 예문을 생성할 것 (null 불가)
  - 고등학생이 쉽게 이해할 수 있는 짧고 간단한 문장 (10단어 이내)
  - 일상생활에서 자주 쓰이는 쉬운 단어로 구성
  - 해당 단어의 뜻이 문맥에서 자연스럽게 드러나야 함
  - ⭐ 예문에는 표제어를 **원형(기본형) 그대로** 넣을 것 — 과거형·복수형·3인칭 단수 등
    활용형 금지. 학생이 예문 빈칸 퀴즈·스펠링에서 원형으로 답하므로 형태가 어긋나면 오출제됨
- 예문 한글 해석(ek): 영어 예문에 대응하는 자연스러운 한국어 해석 (null 불가)
- 유의어/반의어/숙어도 고등학생 수준에 맞게 선택

JSON 배열로만 응답 (다른 텍스트 없이):
[{"id":"원본id","s":"유의어1, 유의어2","a":"반의어1","e":"Example sentence.","ek":"예문 해석.","i":[{"en":"숙어","ko":"뜻","example_en":"예문","example_ko":"해석"}]}]`;

// 영영 교재 (definition_lang='en') — 한글 해석 없이, 숙어 뜻도 영어로
const PROMPT_EN = `아래 영어 단어 목록에 대해 유의어, 반의어, 관련 숙어, 예문을 생성해주세요.
이 교재는 국제학교·유학생용 영영(EN-EN) 단어장입니다. 한국어를 만들지 마세요.

규칙:
- 각 단어의 id를 그대로 유지
- 유의어(s): 쉼표로 구분, 없으면 null
- 반의어(a): 쉼표로 구분, 없으면 null
- 숙어(i): 관련 숙어 배열, 없으면 null. 숙어의 뜻(ko 필드)은 쉬운 영어 정의로 쓸 것
- 예문(e): 반드시 모든 단어에 예문을 생성할 것 (null 불가)
  - 고등학생이 쉽게 이해할 수 있는 짧고 간단한 문장 (10단어 이내)
  - 해당 단어의 뜻이 문맥에서 자연스럽게 드러나야 함
  - ⭐ 예문에는 표제어를 **원형(기본형) 그대로** 넣을 것 — 과거형·복수형·3인칭 단수 등
    활용형 금지. 학생이 예문 빈칸 퀴즈·스펠링에서 원형으로 답하므로 형태가 어긋나면 오출제됨
- 예문 한글 해석(ek): 항상 null (영영 교재 — 해석 만들지 말 것)

JSON 배열로만 응답 (다른 텍스트 없이):
[{"id":"원본id","s":"유의어1, 유의어2","a":"반의어1","e":"Example sentence.","ek":null,"i":[{"en":"숙어","ko":"easy English meaning","example_en":"예문","example_ko":null}]}]`;

const enrichSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    front_text: z.string(),
    back_text: z.string(),
    part_of_speech: z.string().nullable(),
    example_sentence: z.string().nullable().optional(),
    spelling_answer: z.string().nullable().optional(),
  })).min(1, '단어 목록이 비어있습니다.'),
  // 교재 정의 언어 자동 분기용 — bookId 또는 dayId(→교재 역추적). 없으면 영한(ko) 기본
  bookId: z.string().uuid().optional(),
  dayId: z.string().uuid().optional(),
});

type EnrichBody = z.infer<typeof enrichSchema>;
type VocabItem = EnrichBody['items'][number];

interface AiEnrichResult { id: string; s?: string | null; a?: string | null; e?: string | null; ek?: string | null; i?: unknown[] | null }

async function enrichChunk(items: VocabItem[], definitionLang: 'ko' | 'en') {
  const wordList = items.map((item) => `- id:${item.id} | ${item.front_text} (${item.back_text}, ${item.part_of_speech || ''})`).join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [{ role: 'user', content: `${definitionLang === 'en' ? PROMPT_EN : PROMPT_KO}\n\n---\n${wordList}\n---` }],
  });

  const raw = parseAiJsonArray<AiEnrichResult>(message);
  return raw.map((item) => ({
    id: item.id,
    synonyms: item.s || null,
    antonyms: item.a || null,
    example_sentence: item.e || null,
    example_sentence_ko: item.ek || null,
    idioms: item.i || null,
  }));
}

export const POST = createApiHandler(
  // 5/시간이던 것 — 대량 추출 후 2회독 자동 보강이 Day마다 호출해 6개 Day부터
  // 조용히 실패하던 잠복 버그. 분당 기준으로 명시
  { roles: ['teacher', 'admin', 'boss'], schema: enrichSchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async ({ body, supabase }) => {
    const { items, bookId, dayId } = body;

    // 교재 정의 언어 조회 (영영 교재면 한글 해석 생성 안 함)
    let definitionLang: 'ko' | 'en' = 'ko';
    let resolvedBookId = bookId ?? null;
    if (!resolvedBookId && dayId) {
      const { data: day } = await supabase
        .from('voca_days')
        .select('book_id')
        .eq('id', dayId)
        .single();
      resolvedBookId = day?.book_id ?? null;
    }
    if (resolvedBookId) {
      const { data: book } = await supabase
        .from('voca_books')
        .select('definition_lang')
        .eq('id', resolvedBookId)
        .single();
      if (book?.definition_lang === 'en') definitionLang = 'en';
    }

    // 20개씩 청크 처리
    const CHUNK_SIZE = 20;
    const chunks: VocabItem[][] = [];
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      chunks.push(items.slice(i, i + CHUNK_SIZE));
    }

    logger.info('ai.enrich_round2', { totalWords: items.length, chunks: chunks.length, definitionLang });

    // 원본 단어 맵 (spelling/example 보완용)
    const itemMap = new Map(items.map((i) => [i.id, i]));

    const results = await Promise.all(chunks.map((c) => enrichChunk(c, definitionLang)));
    const enriched = results.flat();

    // DB 업데이트 (병렬)
    const dbResults = await Promise.all(
      enriched.map((item) => {
        const orig = itemMap.get(item.id);
        const updateData: Record<string, unknown> = {
          synonyms: item.synonyms,
          antonyms: item.antonyms,
          idioms: item.idioms,
        };
        // 예문 항상 업데이트 (기존 어려운 문장도 교체)
        if (item.example_sentence) {
          updateData.example_sentence = item.example_sentence;
        }
        if (item.example_sentence_ko) {
          updateData.example_sentence_ko = item.example_sentence_ko;
        }
        // 스펠링 데이터 없으면 보충
        if (!orig?.spelling_answer && orig?.front_text) {
          updateData.spelling_answer = orig.front_text;
          updateData.spelling_hint = orig.back_text;
        }
        return supabase
          .from('voca_vocabulary')
          .update(updateData)
          .eq('id', item.id);
      })
    );
    const updated = dbResults.filter((r) => !r.error).length;

    return NextResponse.json({ updated });
  }
);
