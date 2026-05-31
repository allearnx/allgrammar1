import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { parseAiJsonArray } from '@/lib/ai-json';

export const maxDuration = 120;

const anthropic = new Anthropic();

const PROMPT = `이 PDF에서 영어 단어를 추출해주세요.

## 필수 규칙
- 중복 없이 핵심 단어만 선별
- 관사(a, the), 전치사(in, on), 대명사(I, you) 등 기본 단어 제외
- 고유명사 제외

## 품사(p) 규칙
- PDF에 품사가 표기되어 있으면 그대로 따라갈 것
- PDF에 같은 단어가 품사별로 나뉘어 있으면 (예: run n. / run v.) 별도 항목으로 분리
- PDF에 품사 구분 없이 한 단어로만 있으면 하나의 항목으로 합쳐서 p에 "n. v." 형태로 표기
- PDF에 품사 자체가 없으면 가장 대표적인 품사 1개를 넣을 것

## 예문(e) 규칙 — 반드시 생성
- PDF에 예문이 있으면 그대로 사용
- PDF에 예문이 없으면 반드시 자연스러운 영어 예문을 만들어서 넣을 것
- 예문에 해당 단어가 반드시 포함되어야 함
- 중학생 수준의 쉬운 문장으로 작성 (15단어 이내)
- e 필드가 null이면 안 됨

## 예문 한글 해석(ek) 규칙 — 반드시 생성
- 영어 예문(e)에 대응하는 자연스러운 한국어 해석
- ek 필드가 null이면 안 됨

## 유의어(s)·반의어(a)·숙어(i) 규칙
- 자연스럽게 떠오르는 것만 넣고, 억지로 만들지 않을 것
- 없으면 null

JSON 배열로만 응답 (다른 텍스트 없이):
[{"w":"단어","m":"뜻","p":"n.","e":"The example sentence.","ek":"예문 해석.","s":"유의어1, 유의어2","a":"반의어1","i":[{"en":"숙어","ko":"뜻","example_en":"예문","example_ko":"해석"}]}]
w=단어, m=뜻, p=품사(n./v./adj./adv./prep./conj.), e=영어 예문(필수!), ek=예문 한글 해석(필수!), s=유의어(쉼표 구분, 없으면 null), a=반의어(쉼표 구분, 없으면 null), i=숙어 배열(없으면 null)`;

interface VocabExtractItem {
  w: string;
  m: string;
  p?: string;
  e?: string | null;
  ek?: string | null;
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
    // FormData 업로드 시 PDF 파일 타입 검증
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const formData = await request.clone().formData();
      const file = formData.get('file') as File | null;
      if (file && file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'PDF 파일만 지원합니다.' }, { status: 400 });
      }
    }

    const { parsePdfInput, cleanupStorage } = await import('@/lib/api/pdf-input');
    const { documentBlock, storagePath } = await parsePdfInput(request);

    logger.info('ai.pdf_extract', { mode: storagePath ? 'url' : 'formdata' });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16384,
      messages: [
        {
          role: 'user',
          content: [
            documentBlock,
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    const raw = parseAiJsonArray<VocabExtractItem>(message);
    const mapped = raw
      .filter((item) => item.w && item.m) // w, m 필수
      .map((item) => ({
        front_text: item.w.trim(),
        back_text: item.m.trim(),
        part_of_speech: item.p?.trim() || null,
        example_sentence: item.e?.trim() || null,
        example_sentence_ko: item.ek?.trim() || null,
        spelling_hint: item.m.trim() || null,
        spelling_answer: item.w.trim() || null,
        synonyms: item.s?.trim() || null,
        antonyms: item.a?.trim() || null,
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

    cleanupStorage(storagePath);
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
