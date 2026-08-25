import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { extractAiText, parseAiJsonObject } from '@/lib/ai-json';

export const maxDuration = 120;

const anthropic = new Anthropic();

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 50 } },
  async ({ request }) => {
    try {
      const { parsePdfInput, cleanupStorage } = await import('@/lib/api/pdf-input');
      const { documentBlock, storagePath } = await parsePdfInput(request);

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: [
              documentBlock,
              {
                type: 'text',
                text: `이 PDF는 중학교 영어 교과서 대화문 자료입니다.
한 PDF 안에 여러 개의 대화문이 있을 수 있습니다 (예: Listen and Check 1/2/3,
In Everyday Life, Enjoy the Clip 등 섹션이나 번호로 구분).
**대화문마다 분리해서**, 영어 원문과 한국어 해석을 문장 단위로 짝지어 추출해주세요.

규칙:
- 섹션·번호가 바뀌거나 등장인물·주제가 바뀌면 별도의 대화문으로 분리
- 각 대화문의 title은 PDF의 섹션명·번호를 활용 (예: "Listen and Check 1"), 없으면 빈 문자열
- 각 대화 문장에 대해 영어 원문, 한국어 번역, 화자(speaker)를 추출
- **한 항목에는 영어 한 문장만** — 한 화자가 여러 문장을 연속으로 말하면 문장마다
  별도 항목으로 분리 (speaker는 같은 값 반복), 한국어 해석도 문장 단위로 나눠 1:1 대응
- 화자는 이름이나 A/B/G/M 등으로 표시 (없으면 빈 문자열)
- 영어 원문은 원래 문장 그대로 유지 (구두점 포함). 문법 설명·주석·해설·문제는 제외
- 한국어 번역은 PDF의 우리말 해석을 사용하되, 반드시 영어와 1:1로 정확히 대응해야 함

JSON 객체로만 응답 (다른 텍스트 없이):
{
  "dialogues": [
    {
      "title": "Listen and Check 1",
      "sentences": [
        { "original": "Hi, how are you?", "korean": "안녕, 어떻게 지내?", "speaker": "A" },
        { "original": "I'm fine, thanks.", "korean": "잘 지내, 고마워.", "speaker": "B" }
      ]
    }
  ]
}`,
              },
            ],
          },
        ],
      });

      interface ExtractedDialogue {
        title?: string;
        sentences?: { original: string; korean: string; speaker?: string }[];
      }
      interface ExtractResult extends ExtractedDialogue {
        dialogues?: ExtractedDialogue[];
      }

      const result = parseAiJsonObject<ExtractResult>(message);
      if (!result) {
        logger.warn('ai.dialogue_parse_fail', { raw: extractAiText(message).slice(0, 500) });
        throw new Error('AI 응답에서 JSON을 파싱할 수 없습니다.');
      }

      // AI가 배열 없이 구 형식({title, sentences})으로 응답해도 수용
      const rawDialogues = result.dialogues ?? (result.sentences ? [result] : []);
      const dialogues = rawDialogues
        .filter((d) => Array.isArray(d.sentences) && d.sentences.length > 0)
        .map((d, i) => ({
          title: d.title?.trim() || `대화문 ${i + 1}`,
          sentences: d.sentences!,
        }));

      cleanupStorage(storagePath);
      // title/sentences: 배포 전 로드된 구버전 클라이언트 호환 (첫 대화문)
      return NextResponse.json({
        dialogues,
        title: dialogues[0]?.title ?? '',
        sentences: dialogues[0]?.sentences ?? [],
      });
    } catch (error) {
      logger.error('ai.dialogue_pdf_extract', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'PDF에서 대화문 추출 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
);
