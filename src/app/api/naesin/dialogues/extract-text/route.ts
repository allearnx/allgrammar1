import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { extractAiText, parseAiJsonObject } from '@/lib/ai-json';

export const maxDuration = 120;

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !['teacher', 'admin', 'boss'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = await checkRateLimit(user.id, 'naesin/dialogues/extract-text', 50);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일을 업로드해주세요.' }, { status: 400 });
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
              text: `이 PDF는 중학교 영어 교과서 대화문입니다.
영어 원문과 한국어 해석을 **문장 단위로 짝지어서** 추출해주세요.

규칙:
- 각 대화 문장에 대해 영어 원문, 한국어 번역, 화자(speaker)를 추출
- 화자는 이름이나 A/B 등으로 표시 (없으면 빈 문자열)
- 영어 원문은 원래 문장 그대로 유지 (구두점 포함)
- 한국어 번역도 원래 문장 그대로 유지
- 반드시 영어와 한국어가 1:1로 정확히 대응해야 함
- 제목이 있으면 title로 추출, 없으면 빈 문자열

JSON 객체로만 응답 (다른 텍스트 없이):
{
  "title": "대화문 제목",
  "sentences": [
    { "original": "Hi, how are you?", "korean": "안녕, 어떻게 지내?", "speaker": "A" },
    { "original": "I'm fine, thanks.", "korean": "잘 지내, 고마워.", "speaker": "B" }
  ]
}`,
            },
          ],
        },
      ],
    });

    interface ExtractResult {
      title?: string;
      sentences?: { original: string; korean: string; speaker?: string }[];
    }

    const result = parseAiJsonObject<ExtractResult>(message);
    if (!result) {
      logger.warn('ai.dialogue_parse_fail', { raw: extractAiText(message).slice(0, 500) });
      throw new Error('AI 응답에서 JSON을 파싱할 수 없습니다.');
    }

    return NextResponse.json({
      title: result.title || '',
      sentences: result.sentences || [],
    });
  } catch (error) {
    logger.error('ai.dialogue_pdf_extract', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF에서 대화문 추출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
