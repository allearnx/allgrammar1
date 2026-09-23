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
        // 상위 모델 — Haiku는 simile→smile, talking→taking처럼 오독하고 빈칸을 지어내 원문과 다른 문장을 만들었다
        // (2026-09-23 미래엔 공통영어2 올림포스 지문 6건 훼손). 정확도 우선.
        model: 'claude-sonnet-5',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: [
              ...blocks,
              {
                type: 'text',
                text: `${isImage
                  ? `이 사진${blocks.length > 1 ? `들(${blocks.length}장, 페이지 순서대로)` : ''}은 중·고등학교 영어 지문(교과서·부교재·학습지)을 촬영한 것입니다.`
                  : '이 PDF는 중·고등학교 영어 지문(교과서·부교재·학습지)입니다.'}
**본문 지문만** 영어 원문과 한국어 해석을 문장 단위로 짝지어서 추출해주세요.

규칙:
- 영어 1문장과 그에 대응하는 한국어 번역 1문장을 짝으로 묶어 sentences 배열로 추출
- 한 문장 = 마침표(.) / 물음표(?) / 느낌표(!) 로 끝나는 단위
- 영어 원문은 보이는 글자 그대로 유지 (구두점 포함)
- 한국어 번역도 원래 문장 그대로 유지
- 반드시 영어와 한국어가 1:1로 정확히 대응해야 함

⛔ 절대 금지 (학생이 이 문장을 그대로 외우므로 원문과 한 글자도 달라선 안 됨):
- 추측해서 쓰지 말 것. 흐릿하거나 가려져 안 보이는 단어가 있으면 그 문장은 통째로 제외한다.
- 빈칸(_____, ( ), 네모칸)이 있으면 채우지 말 것. 빈칸이 포함된 문장은 제외한다.
- 문법을 고치거나 자연스럽게 다듬지 말 것. 어색해 보여도 인쇄된 그대로 옮긴다.
- 문장을 요약·축약·재구성하지 말 것.

본문이 아닌 것은 전부 제외:
- 문제 발문·선택지(①②③④⑤)·보기·정답·해설
- 서술형/논술형 문제의 조건, 채점 기준, 배점 표시
- 페이지 번호, 머리말, 출처 표기, 학습 목표, 어휘 목록
- 손글씨·밑줄·동그라미 등 인쇄되지 않은 표시
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
