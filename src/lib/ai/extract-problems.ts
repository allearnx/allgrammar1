import Anthropic from '@anthropic-ai/sdk';
import { PDFDocument } from 'pdf-lib';
import { parseAiJsonArray, parseAiJsonObject } from '@/lib/ai-json';
import { logger } from '@/lib/logger';
import { ANSWER_KEY_PROMPT } from './extract-problem-prompts';

/**
 * 문제지 AI 추출 호출 레이어 — extract-pdf / extract-images 라우트 공용.
 * 프롬프트는 extract-problem-prompts.ts, 결과 정규화는
 * lib/naesin/normalize-extracted-questions.ts 참고.
 */

const MODEL = 'claude-haiku-4-5-20251001';

const anthropic = new Anthropic();

export type ExtractedQuestion = Record<string, unknown>;

/** PDF를 N페이지씩 청크로 분할하여 각각의 base64 반환 */
export async function splitPdfIntoChunks(pdfBytes: ArrayBuffer, pagesPerChunk: number) {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  if (totalPages <= pagesPerChunk) {
    return [{ base64: Buffer.from(pdfBytes).toString('base64'), pages: `1-${totalPages}` }];
  }

  const chunks: { base64: string; pages: string }[] = [];
  for (let start = 0; start < totalPages; start += pagesPerChunk) {
    const end = Math.min(start + pagesPerChunk, totalPages);
    const chunkDoc = await PDFDocument.create();
    const copiedPages = await chunkDoc.copyPages(srcDoc, Array.from({ length: end - start }, (_, i) => start + i));
    copiedPages.forEach((page) => chunkDoc.addPage(page));
    const chunkBytes = await chunkDoc.save();
    chunks.push({
      base64: Buffer.from(chunkBytes).toString('base64'),
      pages: `${start + 1}-${end}`,
    });
  }

  return chunks;
}

/** 단일 PDF 청크에 대해 Claude API 호출 */
export async function extractFromPdfChunk(base64Data: string, chunkLabel: string, prompt: string) {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16384,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const questions = parseAiJsonArray(message);
  logger.info('ai.pdf_extract.chunk_done', { chunk: chunkLabel, count: questions.length });
  return questions as ExtractedQuestion[];
}

/** 이미지(base64)에 대해 Claude API 호출 */
export async function extractFromImage(base64Data: string, mediaType: string, label: string, prompt: string) {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16384,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif', data: base64Data },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const questions = parseAiJsonArray(message);
  logger.info('ai.image_extract.done', { label, count: questions.length });
  return questions as ExtractedQuestion[];
}

/** URL 기반 이미지 여러 장에 대해 Claude API 호출 (한 번에 전달) */
export async function extractFromImageUrls(imageUrls: { url: string }[], prompt: string) {
  const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [
    ...imageUrls.map((img) => ({
      type: 'image' as const,
      source: { type: 'url' as const, url: img.url } as { type: 'url'; url: string },
    })),
    { type: 'text' as const, text: prompt },
  ];

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16384,
    messages: [{ role: 'user', content }],
  });

  return parseAiJsonArray(message) as ExtractedQuestion[];
}

/** URL 기반 PDF에 대해 Claude API 호출 (Vercel 본문 제한 우회) */
export async function extractFromPdfUrl(pdfUrl: string, prompt: string) {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16384,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'url', url: pdfUrl },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const questions = parseAiJsonArray(message);
  logger.info('ai.pdf_extract.url_done', { count: questions.length });
  return questions as ExtractedQuestion[];
}

/** PDF base64에서 정답표만 추출 (병렬 호출용) */
export async function extractAnswerKeyFromPdfChunk(base64Data: string): Promise<Record<string, string>> {
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
            { type: 'text', text: ANSWER_KEY_PROMPT },
          ],
        },
      ],
    });
    return parseAiJsonObject<Record<string, string>>(message) ?? {};
  } catch (e) {
    logger.warn('ai.answer_key_extract.failed', { error: String(e) });
    return {};
  }
}

/** URL 기반 PDF에서 정답표만 추출 (병렬 호출용) */
export async function extractAnswerKeyFromPdfUrl(pdfUrl: string): Promise<Record<string, string>> {
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'document', source: { type: 'url', url: pdfUrl } },
            { type: 'text', text: ANSWER_KEY_PROMPT },
          ],
        },
      ],
    });
    return parseAiJsonObject<Record<string, string>>(message) ?? {};
  } catch (e) {
    logger.warn('ai.answer_key_extract.failed', { error: String(e) });
    return {};
  }
}
