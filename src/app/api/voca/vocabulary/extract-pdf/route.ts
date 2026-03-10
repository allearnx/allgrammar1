import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import Anthropic from '@anthropic-ai/sdk';
import { extractText } from 'unpdf';

export const maxDuration = 120;

const anthropic = new Anthropic();

const CHUNK_SIZE = 3000; // 청크당 ~3000자 → 각 요청 10~20초

const PROMPT = `아래 텍스트에서 영어 단어를 추출해주세요.

규칙:
- 중복 없이 핵심 단어만 선별
- 관사(a, the), 전치사(in, on), 대명사(I, you) 등 기본 단어 제외
- 고유명사 제외
- 각 단어에 관련 숙어가 있으면 idioms 배열에 포함

JSON 배열로만 응답 (다른 텍스트 없이):
[
  {
    "front_text": "영어 단어",
    "back_text": "한국어 뜻",
    "part_of_speech": "n./v./adj./adv.",
    "example_sentence": "텍스트에서 가져온 예문 또는 자연스러운 예문",
    "synonyms": "유의어 (없으면 null)",
    "antonyms": "반의어 (없으면 null)",
    "idioms": [{"en": "영어 숙어", "ko": "한국어 뜻", "example_en": "예문(영어)", "example_ko": "예문(한국어)"}]
  }
]
idioms가 없으면 null로 표시.`;

function splitIntoChunks(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLen, text.length);
    // 문장 중간에서 자르지 않도록 마지막 줄바꿈/마침표 위치에서 자르기
    if (end < text.length) {
      const lastBreak = text.lastIndexOf('\n', end);
      if (lastBreak > start) end = lastBreak + 1;
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

async function extractChunk(chunk: string): Promise<unknown[]> {
  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 16384,
    messages: [
      {
        role: 'user',
        content: `${PROMPT}\n\n--- 텍스트 시작 ---\n${chunk}\n--- 텍스트 끝 ---`,
      },
    ],
  });

  const message = await stream.finalMessage();
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const cleaned = responseText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  return JSON.parse(jsonMatch[0]);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !['teacher', 'admin', 'boss'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일을 업로드해주세요.' }, { status: 400 });
    }

    // PDF 텍스트 추출 (서버리스 호환)
    const arrayBuffer = await file.arrayBuffer();
    const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
    const pdfText = (text as string).trim();

    if (!pdfText) {
      return NextResponse.json(
        { error: '텍스트를 추출할 수 없는 PDF입니다. (스캔/이미지 PDF는 지원하지 않습니다)' },
        { status: 400 }
      );
    }

    // 텍스트를 청크로 분할 → 병렬 처리 (각 청크 10~20초, 전체 동시 실행)
    const chunks = splitIntoChunks(pdfText, CHUNK_SIZE);
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
    console.error('PDF extraction error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `PDF 단어 추출 중 오류: ${message}` },
      { status: 500 }
    );
  }
}
