import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';
import { logger } from '@/lib/logger';
import { parseAiJsonArray } from '@/lib/ai-json';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120;

const anthropic = new Anthropic();

const PROMPT = `아래 영어 단어 목록에 대해 유의어, 반의어, 관련 숙어를 생성해주세요.

규칙:
- 각 단어의 id를 그대로 유지
- 유의어(s): 쉼표로 구분, 없으면 null
- 반의어(a): 쉼표로 구분, 없으면 null
- 숙어(i): 관련 숙어 배열, 없으면 null
- 중학생 수준에 맞는 쉬운 유의어/반의어/숙어 선택

JSON 배열로만 응답 (다른 텍스트 없이):
[{"id":"원본id","s":"유의어1, 유의어2","a":"반의어1","i":[{"en":"숙어","ko":"뜻","example_en":"예문","example_ko":"해석"}]}]`;

const enrichSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    front_text: z.string(),
    back_text: z.string(),
    part_of_speech: z.string().nullable(),
  })).min(1, '단어 목록이 비어있습니다.'),
});

type EnrichBody = z.infer<typeof enrichSchema>;
type VocabItem = EnrichBody['items'][number];

interface AiEnrichResult { id: string; s?: string | null; a?: string | null; i?: unknown[] | null }

async function enrichChunk(items: VocabItem[]) {
  const wordList = items.map((item) => `- id:${item.id} | ${item.front_text} (${item.back_text}, ${item.part_of_speech || ''})`).join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [{ role: 'user', content: `${PROMPT}\n\n---\n${wordList}\n---` }],
  });

  const raw = parseAiJsonArray<AiEnrichResult>(message);
  return raw.map((item) => ({
    id: item.id,
    synonyms: item.s || null,
    antonyms: item.a || null,
    idioms: item.i || null,
  }));
}

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: enrichSchema, rateLimit: { max: 5 } },
  async ({ body, supabase }) => {
    const { items } = body;

    // 20개씩 청크 처리
    const CHUNK_SIZE = 20;
    const chunks: VocabItem[][] = [];
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      chunks.push(items.slice(i, i + CHUNK_SIZE));
    }

    logger.info('ai.enrich_round2', { totalWords: items.length, chunks: chunks.length });

    const results = await Promise.all(chunks.map(enrichChunk));
    const enriched = results.flat();

    // DB 업데이트 (병렬)
    const dbResults = await Promise.all(
      enriched.map((item) =>
        supabase
          .from('voca_vocabulary')
          .update({ synonyms: item.synonyms, antonyms: item.antonyms, idioms: item.idioms })
          .eq('id', item.id)
      )
    );
    const updated = dbResults.filter((r) => !r.error).length;

    return NextResponse.json({ updated });
  }
);
