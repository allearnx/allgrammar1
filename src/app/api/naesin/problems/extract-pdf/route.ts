import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray, parseAiJsonArray } from '@/lib/ai-json';
import { PDFDocument } from 'pdf-lib';

export const maxDuration = 300;

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
const PAGES_PER_CHUNK = 3;

const anthropic = new Anthropic();

const EXTRACT_PROMPT = `이 PDF는 중학교 영어 시험 문제지입니다.
문제, 보기, 정답, 해설을 추출해주세요.

규칙:
- 각 문제의 번호, 문제 내용, 보기(있는 경우), 정답, 해설을 추출
- 객관식은 options 배열에 보기를 넣고, answer에 정답 번호를 넣기
- 주관식은 options를 빈 배열로, answer에 정답 텍스트를 넣기
- 해설이 없으면 explanation은 빈 문자열
- 문제 번호(number)는 PDF에 적힌 원래 번호를 그대로 사용
- 반드시 JSON 배열로만 응답하세요. 앞뒤에 설명이나 마크다운 코드펜스 없이 순수 JSON만 출력

JSON 배열 형식:
[
  {
    "number": 1,
    "question": "문제 내용",
    "options": ["1번 보기", "2번 보기", "3번 보기", "4번 보기", "5번 보기"],
    "answer": "3",
    "explanation": "해설"
  }
]`;

/** PDF를 N페이지씩 청크로 분할하여 각각의 base64 반환 */
async function splitPdfIntoChunks(pdfBytes: ArrayBuffer, pagesPerChunk: number) {
  const srcDoc = await PDFDocument.load(pdfBytes);
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

/** 단일 청크에 대해 Claude API 호출 */
async function extractFromChunk(base64Data: string, chunkLabel: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16384,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
          },
          { type: 'text', text: EXTRACT_PROMPT },
        ],
      },
    ],
  });

  const questions = parseAiJsonArray(message);
  logger.info('ai.pdf_extract.chunk_done', { chunk: chunkLabel, count: questions.length });
  return questions;
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !['teacher', 'admin', 'boss'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  try { await requireContentPermission(user, supabase); } catch {
    return NextResponse.json({ error: '콘텐츠 관리 권한이 없습니다.' }, { status: 403 });
  }

  const limited = await checkRateLimit(user.id, 'naesin/problems/extract-pdf', 50);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일을 업로드해주세요.' }, { status: 400 });
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: `PDF 파일이 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)}MB). 10MB 이하만 가능합니다.` },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const chunks = await splitPdfIntoChunks(arrayBuffer, PAGES_PER_CHUNK);

    logger.info('ai.pdf_extract.start', {
      userId: user.id,
      fileSize: arrayBuffer.byteLength,
      totalChunks: chunks.length,
      pages: chunks.map((c) => c.pages).join(', '),
    });

    let allQuestions: Record<string, unknown>[];

    try {
      if (chunks.length === 1) {
        // 3페이지 이하: 단일 호출
        allQuestions = await extractFromChunk(chunks[0].base64, chunks[0].pages) as Record<string, unknown>[];
      } else {
        // 4페이지 이상: 병렬 호출
        const results = await Promise.all(
          chunks.map((chunk) => extractFromChunk(chunk.base64, chunk.pages)),
        );
        allQuestions = results.flat() as Record<string, unknown>[];
      }
    } catch (apiError) {
      const apiMsg = apiError instanceof Error ? apiError.message : String(apiError);
      const apiStatus = (apiError as { status?: number })?.status;
      console.log(JSON.stringify({
        level: 'error',
        msg: 'ai.pdf_extract.api_error',
        ts: new Date().toISOString(),
        error: apiMsg,
        status: apiStatus,
        fileSize: arrayBuffer.byteLength,
      }));

      if (apiMsg.includes('too large') || apiMsg.includes('token') || apiMsg.includes('size')) {
        return NextResponse.json(
          { error: 'PDF 페이지가 너무 많거나 용량이 큽니다. 페이지 수를 줄여서 다시 시도해주세요.' },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: `AI 서버 연결에 실패했습니다. (${apiStatus ?? '?'}: ${apiMsg.slice(0, 120)})` },
        { status: 502 },
      );
    }

    // 문제 번호순 정렬 + 중복 제거
    const seen = new Set<number>();
    const questions = allQuestions
      .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
      .filter((q) => {
        const num = Number(q.number);
        if (seen.has(num)) return false;
        seen.add(num);
        return true;
      });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'PDF에서 문제를 찾을 수 없습니다. 문제가 포함된 PDF인지 확인해주세요.' },
        { status: 422 },
      );
    }

    logger.info('ai.pdf_extract.done', { count: questions.length, chunks: chunks.length });
    return NextResponse.json({ questions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('ai.pdf_extract', { error: msg });

    console.log(JSON.stringify({
      level: 'error',
      msg: 'ai.pdf_extract.outer_catch',
      ts: new Date().toISOString(),
      error: msg,
      stack: error instanceof Error ? error.stack?.slice(0, 300) : undefined,
    }));

    if (msg.includes('JSON')) {
      return NextResponse.json(
        { error: `AI가 문제를 추출했지만 형식 변환에 실패했습니다. (${msg.slice(0, 100)})` },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: `PDF 문제 추출 중 오류가 발생했습니다. (${msg.slice(0, 120)})` },
      { status: 500 },
    );
  }
}
