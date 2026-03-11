import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { extractText } from 'unpdf';

export const maxDuration = 120;

const anthropic = new Anthropic();

const PROMPT = `아래 텍스트에서 영어 단어를 추출해주세요.

규칙:
- 중복 없이 핵심 단어만 선별
- 관사(a, the), 전치사(in, on), 대명사(I, you) 등 기본 단어 제외
- 고유명사 제외

JSON 배열로만 응답 (다른 텍스트 없이):
[{"w":"영어 단어","m":"한국어 뜻","p":"n."}]
w=단어, m=뜻, p=품사(n./v./adj./adv./prep./conj.)`;

// 페이지 텍스트를 ~6000자 이하 그룹으로 묶기
function groupPages(pages: string[], maxLen: number): string[] {
  const groups: string[] = [];
  let current = '';
  for (const page of pages) {
    if (current && current.length + page.length > maxLen) {
      groups.push(current);
      current = '';
    }
    current += (current ? '\n' : '') + page;
  }
  if (current) groups.push(current);
  return groups;
}

async function extractChunk(chunk: string): Promise<unknown[]> {
  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `${PROMPT}\n\n---\n${chunk}\n---`,
      },
    ],
  });

  const message = await stream.finalMessage();
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const cleaned = responseText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  // 간소화 필드 → 기존 형식으로 변환
  const raw = JSON.parse(jsonMatch[0]);
  return raw.map((item: { w: string; m: string; p?: string }) => ({
    front_text: item.w,
    back_text: item.m,
    part_of_speech: item.p || null,
    example_sentence: null,
    synonyms: null,
    antonyms: null,
    idioms: null,
  }));
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

    // PDF 텍스트 추출 — 페이지 단위 (서버리스 호환)
    const arrayBuffer = await file.arrayBuffer();
    const { text: pages, totalPages } = await extractText(new Uint8Array(arrayBuffer), { mergePages: false });
    const pageTexts = (pages as string[]).filter((p) => p.trim());

    if (pageTexts.length === 0) {
      return NextResponse.json(
        { error: '텍스트를 추출할 수 없는 PDF입니다. (스캔/이미지 PDF는 지원하지 않습니다)' },
        { status: 400 }
      );
    }

    // 페이지를 ~6000자 그룹으로 묶어 병렬 처리
    const chunks = groupPages(pageTexts, 6000);
    logger.info('ai.pdf_extract', { totalPages, chunks: chunks.length });
    const results = await Promise.all(chunks.map(extractChunk));

    // 결과 병합 + 중복 제거 (front_text 기준)
    const seen = new Set<string>();
    const items = results.flat().filter((item) => {
      const word = (item as { front_text: string }).front_text?.toLowerCase();
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
