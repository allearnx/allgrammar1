import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { parseAiJsonArray } from '@/lib/ai-json';

export const maxDuration = 120;

const anthropic = new Anthropic();

const PROMPT = `이 PDF에서 영어 단어를 추출해주세요.

규칙:
- 중복 없이 핵심 단어만 선별
- 관사(a, the), 전치사(in, on), 대명사(I, you) 등 기본 단어 제외
- 고유명사 제외
- 각 단어에 유의어(s), 반의어(a), 관련 숙어(i)도 함께 제공
- 유의어/반의어가 없으면 null, 숙어가 없으면 null

JSON 배열로만 응답 (다른 텍스트 없이):
[{"w":"단어","m":"뜻","p":"n.","e":"The example sentence.","s":"유의어1, 유의어2","a":"반의어1","i":[{"en":"숙어","ko":"뜻","example_en":"예문","example_ko":"해석"}]}]
w=단어, m=뜻, p=품사(n./v./adj./adv./prep./conj.), e=영어 예문(단어를 포함하는 자연스러운 문장), s=유의어(쉼표 구분, 없으면 null), a=반의어(쉼표 구분, 없으면 null), i=숙어 배열(없으면 null)`;

interface VocabExtractItem {
  w: string;
  m: string;
  p?: string;
  e?: string | null;
  s?: string | null;
  a?: string | null;
  i?: Array<{ en: string; ko: string; example_en?: string; example_ko?: string }> | null;
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !['teacher', 'admin', 'boss'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = await checkRateLimit(user.id, 'voca/vocabulary/extract-pdf', 10);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일을 업로드해주세요.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    logger.info('ai.pdf_extract', { fileSize: arrayBuffer.byteLength });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16384,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Data,
              },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    const raw = parseAiJsonArray<VocabExtractItem>(message);
    const mapped = raw.map((item) => ({
      front_text: item.w,
      back_text: item.m,
      part_of_speech: item.p || null,
      example_sentence: item.e || null,
      spelling_hint: item.m || null,
      spelling_answer: item.w || null,
      synonyms: item.s || null,
      antonyms: item.a || null,
      idioms: item.i || null,
    }));

    // 중복 제거 (front_text 기준)
    const seen = new Set<string>();
    const items = mapped.filter((item) => {
      const word = item.front_text?.toLowerCase();
      if (!word || seen.has(word)) return false;
      seen.add(word);
      return true;
    });

    return NextResponse.json({ items });
  } catch (error) {
    logger.error('ai.pdf_extract', { error: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `PDF 단어 추출 중 오류: ${message}` },
      { status: 500 }
    );
  }
}
