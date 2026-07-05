import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import { extractFromImageUrls } from '@/lib/ai/extract-problems';
import { buildExtractPrompt } from '@/lib/ai/extract-problem-prompts';
import { normalizeExtractedQuestions } from '@/lib/naesin/normalize-extracted-questions';

export const maxDuration = 300;

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 50 } },
  async ({ user, supabase, request }) => {
    await requireContentPermission(user, supabase);

    try {
      const { imageUrls, extractType } = await request.json() as {
        imageUrls: { url: string; mediaType: string }[];
        extractType?: string;
      };

      if (!imageUrls?.length) {
        return NextResponse.json({ error: '이미지 URL이 필요합니다.' }, { status: 400 });
      }
      if (imageUrls.length > 10) {
        return NextResponse.json({ error: '이미지는 최대 10장까지 가능합니다.' }, { status: 400 });
      }

      const prompt = buildExtractPrompt('images', extractType || null);

      logger.info('ai.extract_images.start', {
        userId: user.id,
        imageCount: imageUrls.length,
      });

      const allQuestions = await extractFromImageUrls(imageUrls, prompt);

      const { questions, removedImageCount } = normalizeExtractedQuestions(allQuestions);

      if (questions.length === 0) {
        return NextResponse.json(
          { error: '이미지에서 문제를 찾을 수 없습니다. 이미지를 확인해주세요.' },
          { status: 422 },
        );
      }

      logger.info('ai.extract_images.done', { count: questions.length, removedImageCount });
      return NextResponse.json({ questions, ...(removedImageCount > 0 && { removedImageCount }) });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const apiStatus = (error as { status?: number })?.status;
      logger.error('ai.extract_images.error', { error: msg, status: apiStatus });

      if (msg.includes('too large') || msg.includes('token') || msg.includes('size')) {
        return NextResponse.json(
          { error: '이미지가 너무 크거나 많습니다. 이미지를 줄여서 다시 시도해주세요.' },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: `AI 서버 연결에 실패했습니다. (${apiStatus ?? '?'}: ${msg.slice(0, 120)})` },
        { status: 502 },
      );
    }
  }
);
