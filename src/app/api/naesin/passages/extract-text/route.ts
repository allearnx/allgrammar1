import { NextResponse, type NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { extractAiText, parseAiJsonObject } from '@/lib/ai-json';
import type { DocOrImageBlock } from '@/lib/api/pdf-input';

export const maxDuration = 120;

const anthropic = new Anthropic();

const MAX_IMAGES = 6;

/**
 * 입력 통합: JSON `{ imageUrls: string[] }`(사진 여러 장, 페이지 순서대로) 또는
 * PDF/이미지 단일 입력(parseDocOrImageInput)을 AI 콘텐츠 블록 배열로.
 */
async function parsePassageInput(request: NextRequest): Promise<{ blocks: DocOrImageBlock[]; storagePaths: string[] }> {
  const { parseDocOrImageInput } = await import('@/lib/api/pdf-input');
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body: { imageUrls?: unknown; storagePaths?: unknown } = await request.clone().json();
    if (Array.isArray(body.imageUrls)) {
      const urls = body.imageUrls.filter((u): u is string => typeof u === 'string' && u.length > 0);
      if (urls.length === 0) throw new Error('이미지 URL이 필요합니다.');
      if (urls.length > MAX_IMAGES) throw new Error(`사진은 최대 ${MAX_IMAGES}장까지 가능합니다.`);
      const storagePaths = Array.isArray(body.storagePaths)
        ? body.storagePaths.filter((p): p is string => typeof p === 'string')
        : [];
      return {
        blocks: urls.map((url) => ({ type: 'image', source: { type: 'url', url } })),
        storagePaths,
      };
    }
  }

  const { block, storagePath } = await parseDocOrImageInput(request);
  return { blocks: [block], storagePaths: storagePath ? [storagePath] : [] };
}

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 50 } },
  async ({ request }) => {
    try {
      const { cleanupStorage } = await import('@/lib/api/pdf-input');
      const { blocks, storagePaths } = await parsePassageInput(request);
      const isImage = blocks[0].type === 'image';
      const cleanup = () => Promise.all(storagePaths.map((p) => cleanupStorage(p)));

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              ...blocks,
              {
                type: 'text',
                text: `${isImage
                  ? `이 사진${blocks.length > 1 ? `들(${blocks.length}장, 페이지 순서대로)` : ''}은 중학교 영어 교과서 지문을 촬영한 것입니다.`
                  : '이 PDF는 중학교 영어 교과서 지문입니다.'}
영어 원문과 한국어 해석을 **문장 단위로 짝지어서** 추출해주세요.

규칙:
- 영어 1문장과 그에 대응하는 한국어 번역 1문장을 짝으로 묶어 sentences 배열로 추출
- 한 문장 = 마침표(.) / 물음표(?) / 느낌표(!) 로 끝나는 단위
- 영어 원문은 원래 문장 그대로 유지 (구두점 포함)
- 한국어 번역도 원래 문장 그대로 유지
- 반드시 영어와 한국어가 1:1로 정확히 대응해야 함
- 제목이 있으면 title로 추출, 없으면 빈 문자열
- 사진이 여러 장이면 페이지 순서대로 이어서 하나의 지문으로 처리 (페이지 경계에서 잘린 문장은 이어 붙이기)
- 사진의 필기·밑줄·번호 표시 등 인쇄되지 않은 낙서는 무시

JSON 객체로만 응답 (다른 텍스트 없이):
{
  "title": "지문 제목",
  "sentences": [
    { "original": "English sentence 1.", "korean": "한국어 번역 1." },
    { "original": "English sentence 2.", "korean": "한국어 번역 2." }
  ]
}`,
              },
            ],
          },
        ],
      });

      interface ExtractResult {
        title?: string;
        sentences?: { original: string; korean: string }[];
        // Legacy fields (backward compat)
        original_text?: string;
        korean_translation?: string;
      }

      const result = parseAiJsonObject<ExtractResult>(message);
      if (!result) {
        logger.warn('ai.parse_fail', { raw: extractAiText(message).slice(0, 500) });
        throw new Error('AI 응답에서 JSON을 파싱할 수 없습니다.');
      }

      // If AI returned sentences array, build original_text/korean_translation from it
      if (result.sentences && result.sentences.length > 0) {
        const originalText = result.sentences.map((s) => s.original).join(' ');
        const koreanTranslation = result.sentences.map((s) => s.korean).join(' ');
        void cleanup();
        return NextResponse.json({
          title: result.title || '',
          original_text: originalText,
          korean_translation: koreanTranslation,
          sentences: result.sentences,
        });
      }

      void cleanup();

      // Fallback: legacy format
      return NextResponse.json({
        title: result.title || '',
        original_text: result.original_text || '',
        korean_translation: result.korean_translation || '',
      });
    } catch (error) {
      logger.error('ai.pdf_extract', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: error instanceof Error ? error.message : '파일에서 본문 추출 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
);
