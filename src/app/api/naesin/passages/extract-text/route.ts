import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';

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

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
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
              text: `이 PDF는 중학교 영어 교과서 지문입니다.
영어 원문과 한국어 해석을 추출해주세요.

규칙:
- 영어 원문(original_text)과 한국어 번역(korean_translation)을 분리하여 추출
- 영어 원문은 원래 문장 그대로 유지 (줄바꿈, 구두점 포함)
- 한국어 번역도 원래 문장 그대로 유지
- 제목이 있으면 title로 추출, 없으면 빈 문자열

JSON 객체로만 응답 (다른 텍스트 없이):
{
  "title": "지문 제목",
  "original_text": "영어 원문 전체",
  "korean_translation": "한국어 번역 전체"
}`,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = responseText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('ai.parse_fail', { raw: responseText.slice(0, 500) });
      throw new Error('AI 응답에서 JSON을 파싱할 수 없습니다.');
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      title: result.title || '',
      original_text: result.original_text || '',
      korean_translation: result.korean_translation || '',
    });
  } catch (error) {
    logger.error('ai.pdf_extract', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF에서 본문 추출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
