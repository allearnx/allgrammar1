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
- 한국어 번역이 인쇄되어 있으면 그대로 옮기고, 없으면 직접 자연스러운 한국어로 번역해 채운다.
  korean은 절대 빈 문자열로 두지 말 것 (영어 원문은 건드리지 않는다)
- 반드시 영어와 한국어가 1:1로 정확히 대응해야 함

⛔ 절대 금지 (학생이 이 문장을 그대로 외우므로 원문과 한 글자도 달라선 안 됨):
- 추측해서 쓰지 말 것. 흐릿하거나 필기에 가려져 안 보이는 단어는 그 자리에 [?] 를 쓴다.
- 빈칸(_____, ( ), 네모칸)은 채우지 말고 _____ 로 남긴다.
- 문법을 고치거나 자연스럽게 다듬지 말 것. 어색해 보여도 인쇄된 그대로 옮긴다.
- 손글씨는 원문이 아니다. 인쇄된 단어 위에 손으로 고쳐 쓴 단어(예: 인쇄 "sufficient", 손글씨 "insufficient")가 있어도
  반드시 인쇄된 활자("sufficient")를 옮긴다.
- 문장을 요약·축약·재구성하지 말 것.

⚠️ 문장을 버리지 말 것 — 본문의 모든 문장을 빠짐없이 sentences에 넣는다.

문제지 표기가 본문에 섞여 있으면 **완성된 원문 문장으로 복원**한다 (학생은 완성 문장을 외운다):
- 본문 안의 선택지 "(A) because / because of" → 문법·문맥에 맞는 것 하나를 골라 문장에 넣는다. 괄호·기호는 남기지 않는다.
- ①②③④⑤ 번호·밑줄이 붙은 단어 → 번호는 빼고, 문제 발문이 "적절하지 않은 것"을 묻는 유형이면 문맥에 맞지 않는
  그 한 단어를 올바른 단어로 고친다. 나머지는 인쇄된 대로 둔다.
- 빈칸(_____, ( ), 네모칸) → 문맥에 맞는 단어로 채운다. 페이지에 정답이 인쇄돼 있으면 그것을 쓴다.
- 손글씨 답은 참고하지 말고 스스로 판단한다 (학생 필기일 수 있음).
이렇게 복원한 문장은 "needsReview": true 로 표시하고, "note"에 무엇을 어떻게 넣었는지 짧게 적는다
(예: "(A) because/because of → because", "③ sufficient → insufficient", "빈칸 → scarce"). 선생님이 다음 화면에서 확인한다.
흐릿해서 판독이 안 되는 단어만 [?] 로 두고 needsReview: true.

본문이 아닌 것은 전부 제외:
- 문제 발문(예: "다음 글의 밑줄 친 부분 중…")·보기·정답·해설
- 서술형/논술형 문제의 조건, 채점 기준, 배점 표시
- 페이지 번호, 머리말, 출처 표기, 학습 목표, 어휘 목록(Words & Phrases), 워크시트
- 손글씨·밑줄·동그라미 등 인쇄되지 않은 표시
- 제목이 있으면 title로 추출, 없으면 빈 문자열
- 사진이 여러 장이면 페이지 순서대로 이어서 하나의 지문으로 처리 (페이지 경계에서 잘린 문장은 이어 붙이기)

JSON 객체로만 응답 (다른 텍스트 없이):
{
  "title": "지문 제목",
  "sentences": [
    { "original": "English sentence 1.", "korean": "한국어 번역 1." },
    { "original": "Time is scarce because he must choose.", "korean": "한국어 번역 2.", "needsReview": true, "note": "(A) because/because of → because" }
  ]
}`,
              },
            ],
          },
        ],
      });

      interface ExtractResult {
        title?: string;
        sentences?: { original: string; korean: string; needsReview?: boolean; note?: string }[];
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
        // 모델이 복원했다고 표시한 문장 + 복원이 안 돼 선택지·빈칸·[?]·번호가 남은 문장 모두 확인 필요
        const sentences = result.sentences.map((s) => {
          const unresolved = /\[\?\]|_{3,}|[①-⑩]|\([A-E]\)\s*\S+\s*\/\s*\S+/.test(s.original);
          return {
            original: s.original,
            korean: s.korean ?? '',
            needsReview: Boolean(s.needsReview) || unresolved,
            note: s.note || (unresolved ? '선택지·빈칸이 그대로 남음 — 직접 고쳐주세요' : undefined),
          };
        });
        return NextResponse.json({
          title: result.title || '',
          original_text: originalText,
          korean_translation: koreanTranslation,
          sentences,
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
