import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { extractAiText } from '@/lib/ai-json';

export const maxDuration = 120;

const anthropic = new Anthropic();

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 50 } },
  async ({ request }) => {
    try {
      const { parsePdfInput, cleanupStorage } = await import('@/lib/api/pdf-input');
      const { documentBlock, storagePath } = await parsePdfInput(request);

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-5', // 단어/문장 추출은 구조화 작업 — Opus 대비 ~1/5 비용, 품질 검증 완료 (2026-07-17),
        max_tokens: 16384,
        messages: [
          {
            role: 'user',
            content: [
              documentBlock,
              {
                type: 'text',
                text: `이 PDF는 중학교 영어 교과서 자료입니다. 먼저 페이지 유형을 판단하세요.

1) 단어 목록(단어장, 어휘 리스트, 표 형태의 단어 정리)인 경우:
   목록에 실린 **모든 단어와 숙어를 하나도 빠짐없이 그대로** 추출하세요.
   - 선별·생략 절대 금지 — 쉬운 단어도 목록에 있으면 반드시 포함
   - 숙어·구동사·관용 표현도 각각 하나의 항목으로 추출 (예: "give up", "be filled with")
   - 뜻은 목록에 적힌 한국어 뜻을 그대로 사용

2) 본문(읽기 지문)인 경우:
   시험에 출제될 핵심 영어 단어를 선별하세요.
   - 관사(a, the), 전치사(in, on), 대명사(I, you) 등 기본 단어 제외
   - 고유명사 제외

공통: 중복 제거.

JSON 배열로만 응답 (다른 텍스트 없이):
[
  {
    "front_text": "영어 단어 또는 숙어",
    "back_text": "한국어 뜻",
    "part_of_speech": "n./v./adj./adv./phr.",
    "example_sentence": "PDF에서 가져온 예문 또는 자연스러운 예문",
    "synonyms": "유의어 (없으면 null)",
    "antonyms": "반의어 (없으면 null)"
  }
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

      const items = JSON.parse(jsonMatch[0]);

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
);
