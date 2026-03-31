import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { extractAiText } from '@/lib/ai-json';

export const maxDuration = 120;

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !['teacher', 'admin', 'boss'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = await checkRateLimit(user.id, 'naesin/passages/extract-blanks', 10);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const originalText = formData.get('original_text') as string | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일을 업로드해주세요.' }, { status: 400 });
    }

    if (!originalText?.trim()) {
      return NextResponse.json({ error: '원문 텍스트를 입력해주세요.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
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
            {
              type: 'text',
              text: `이 PDF는 영어 교과서 빈칸 채우기 학습지입니다.
PDF에서 빈칸(_____, ( ), 밑줄, 괄호 등)으로 표시된 위치를 찾아주세요.

아래는 빈칸이 없는 원본 영어 텍스트입니다:
---
${originalText}
---

작업:
1. PDF의 텍스트를 읽고, 빈칸으로 표시된 부분을 식별합니다.
2. 원본 텍스트를 공백 기준으로 단어 단위로 분리합니다 (0부터 시작하는 index).
3. PDF에서 빈칸인 위치가 원본 텍스트의 몇 번째 단어(index)에 해당하는지 매칭합니다.
4. 각 빈칸에 대해 { "index": 단어인덱스, "answer": "정답단어" } 형태로 반환합니다.

중요:
- 구두점이 붙은 단어도 그대로 answer에 포함 (예: "hello," → answer: "hello,")
- index는 원본 텍스트를 공백으로 split한 배열의 인덱스 (0-based)
- PDF의 빈칸 순서대로 정렬

JSON 배열로만 응답 (다른 텍스트 없이):
[
  { "index": 2, "answer": "world" },
  { "index": 7, "answer": "example," }
]`,
            },
          ],
        },
      ],
    });

    const cleaned = extractAiText(message);
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.warn('ai.parse_fail', { raw: cleaned.slice(0, 500) });
      throw new Error('AI 응답에서 JSON을 파싱할 수 없습니다.');
    }

    const blanks = JSON.parse(jsonMatch[0]);

    // Validate structure
    const words = originalText.trim().split(/\s+/);
    const validated = blanks
      .filter((b: { index: number; answer: string }) =>
        typeof b.index === 'number' && b.index >= 0 && b.index < words.length && typeof b.answer === 'string'
      )
      .map((b: { index: number; answer: string }) => ({
        index: b.index,
        answer: b.answer,
      }));

    return NextResponse.json({ blanks: validated });
  } catch (error) {
    logger.error('ai.pdf_extract', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF에서 빈칸 추출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
