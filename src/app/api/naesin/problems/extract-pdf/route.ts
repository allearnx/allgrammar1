import { NextResponse } from 'next/server';
import { ValidationError, createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import {
  splitPdfIntoChunks,
  extractFromPdfChunk,
  extractFromImage,
  extractFromPdfUrl,
  extractAnswerKeyFromPdfChunk,
  extractAnswerKeyFromPdfUrl,
  type ExtractedQuestion,
} from '@/lib/ai/extract-problems';
import { buildExtractPrompt } from '@/lib/ai/extract-problem-prompts';
import { normalizeExtractedQuestions } from '@/lib/naesin/normalize-extracted-questions';

export const maxDuration = 300;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
// pdf-lib copyPages가 한글 CID 폰트를 제대로 복사하지 못해 한글 깨짐 발생.
// 시험 문제지는 대부분 20페이지 이하이므로 분할 없이 통째로 Claude에 전달.
const PAGES_PER_CHUNK = 50;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 50 } },
  async ({ user, supabase, request }) => {
    await requireContentPermission(user, supabase);

    try {
      const contentType = request.headers.get('content-type') || '';
      let allQuestions: ExtractedQuestion[];
      let answerKey: Record<string, string> = {};
      let storagePath: string | undefined;

      if (contentType.includes('application/json')) {
        // === URL 기반 추출 (Vercel 4.5MB 본문 제한 우회) ===
        const body = await request.json();
        const pdfUrl: string = body.pdfUrl;
        storagePath = body.storagePath;
        const extractType: string | null = body.extractType || null;
        const prompt = buildExtractPrompt('pdf', extractType);

        if (!pdfUrl) {
          throw new ValidationError('pdfUrl이 필요합니다.');
        }

        logger.info('ai.extract.start', { userId: user.id, mode: 'url' });

        try {
          // 문제 추출 + 정답표 추출 병렬 실행
          const [urlQuestions, urlAnswerKey] = await Promise.all([
            extractFromPdfUrl(pdfUrl, prompt),
            extractAnswerKeyFromPdfUrl(pdfUrl),
          ]);
          allQuestions = urlQuestions;
          answerKey = urlAnswerKey;
        } catch (apiError) {
          const apiMsg = apiError instanceof Error ? apiError.message : String(apiError);
          const apiStatus = (apiError as { status?: number })?.status;
          logger.error('ai.extract.api_error', { error: apiMsg, status: apiStatus, mode: 'url' });

          if (apiMsg.includes('too large') || apiMsg.includes('token') || apiMsg.includes('size')) {
            return NextResponse.json(
              { error: '파일이 너무 크거나 내용이 많습니다. 파일을 나눠서 다시 시도해주세요.' },
              { status: 400 },
            );
          }
          return NextResponse.json(
            { error: `AI 서버 연결에 실패했습니다. (${apiStatus ?? '?'}: ${apiMsg.slice(0, 120)})` },
            { status: 502 },
          );
        }
      } else {
        // === FormData 기반 추출 (기존 방식, 4.5MB 이하 파일) ===
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const extractType = formData.get('extractType') as string | null;
        const prompt = buildExtractPrompt('pdf', extractType);
        const isPdf = file?.type === 'application/pdf';
        const isImage = file ? IMAGE_TYPES.has(file.type) : false;

        if (!file || (!isPdf && !isImage)) {
          throw new ValidationError('PDF 또는 이미지 파일(PNG, JPG)을 업로드해주세요.');
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new ValidationError(`파일이 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)}MB). 20MB 이하만 가능합니다.`);
        }

        const arrayBuffer = await file.arrayBuffer();

        logger.info('ai.extract.start', {
          userId: user.id,
          fileType: file.type,
          fileSize: arrayBuffer.byteLength,
        });

        try {
          if (isImage) {
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            allQuestions = await extractFromImage(base64, file.type, file.name, prompt);
          } else {
            const fullBase64 = Buffer.from(arrayBuffer).toString('base64');
            // 정답표 추출을 문제 추출과 병렬로 시작
            const answerKeyPromise = extractAnswerKeyFromPdfChunk(fullBase64);

            const chunks = await splitPdfIntoChunks(arrayBuffer, PAGES_PER_CHUNK);
            logger.info('ai.pdf_extract.chunks', {
              totalChunks: chunks.length,
              pages: chunks.map((c) => c.pages).join(', '),
            });

            if (chunks.length === 1) {
              allQuestions = await extractFromPdfChunk(chunks[0].base64, chunks[0].pages, prompt);
            } else {
              const results = await Promise.all(
                chunks.map((chunk) => extractFromPdfChunk(chunk.base64, chunk.pages, prompt)),
              );
              allQuestions = results.flat();
            }

            answerKey = await answerKeyPromise;
          }
        } catch (apiError) {
          const apiMsg = apiError instanceof Error ? apiError.message : String(apiError);
          const apiStatus = (apiError as { status?: number })?.status;
          logger.error('ai.extract.api_error', {
            error: apiMsg,
            status: apiStatus,
            fileSize: arrayBuffer.byteLength,
            fileType: file.type,
          });

          if (apiMsg.includes('too large') || apiMsg.includes('token') || apiMsg.includes('size')) {
            return NextResponse.json(
              { error: '파일이 너무 크거나 내용이 많습니다. 파일을 나눠서 다시 시도해주세요.' },
              { status: 400 },
            );
          }
          return NextResponse.json(
            { error: `AI 서버 연결에 실패했습니다. (${apiStatus ?? '?'}: ${apiMsg.slice(0, 120)})` },
            { status: 502 },
          );
        }
      }

      const { questions, answerKeyCount, mergedCount, removedImageCount } =
        normalizeExtractedQuestions(allQuestions, answerKey);
      if (answerKeyCount > 0) {
        logger.info('ai.answer_key_extract.merged', { keyCount: answerKeyCount, mergedCount, questionCount: allQuestions.length });
      }

      if (questions.length === 0) {
        return NextResponse.json(
          { error: 'PDF에서 문제를 찾을 수 없습니다. 문제가 포함된 PDF인지 확인해주세요.' },
          { status: 422 },
        );
      }

      // Storage 임시 파일 삭제
      if (storagePath) {
        import('@/lib/supabase/admin').then(({ createAdminClient }) => {
          createAdminClient().storage.from('public-images').remove([storagePath!]).catch(() => {});
        });
      }

      logger.info('ai.extract.done', { count: questions.length, answerKeyFound: answerKeyCount > 0, mergedCount, removedImageCount });
      return NextResponse.json({
        questions,
        ...(removedImageCount > 0 && { removedImageCount }),
        ...(answerKeyCount > 0 && { answerKeyFound: true, answerKeyMerged: mergedCount }),
      });
    } catch (error) {
      // 입력 검증 오류는 표준 에러 응답으로 위임
      if (error instanceof ValidationError) throw error;

      const msg = error instanceof Error ? error.message : String(error);
      logger.error('ai.pdf_extract', { error: msg, stack: error instanceof Error ? error.stack?.slice(0, 300) : undefined });

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
);
