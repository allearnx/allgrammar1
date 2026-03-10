import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import Anthropic from '@anthropic-ai/sdk';
import { PDFParse } from 'pdf-parse';

export const maxDuration = 120;

const anthropic = new Anthropic();

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

    // PDF 텍스트 추출 (라이브러리 — base64 전송보다 훨씬 빠름)
    const arrayBuffer = await file.arrayBuffer();
    const pdf = new PDFParse({ data: new Uint8Array(arrayBuffer) });
    const textResult = await pdf.getText();
    const pdfText = textResult.text.trim();
    await pdf.destroy();

    if (!pdfText) {
      return NextResponse.json(
        { error: '텍스트를 추출할 수 없는 PDF입니다. (스캔/이미지 PDF는 지원하지 않습니다)' },
        { status: 400 }
      );
    }

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 32768,
      messages: [
        {
          role: 'user',
          content: `아래 텍스트에서 영어 단어를 추출해주세요.

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
idioms가 없으면 null로 표시.

--- 텍스트 시작 ---
${pdfText}
--- 텍스트 끝 ---`,
        },
      ],
    });

    const message = await stream.finalMessage();
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Strip markdown code fences if present
    const cleaned = responseText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();

    // Parse JSON array from response
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('AI raw response:', responseText);
      throw new Error('AI 응답에서 JSON을 파싱할 수 없습니다.');
    }

    const items = JSON.parse(jsonMatch[0]);

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
