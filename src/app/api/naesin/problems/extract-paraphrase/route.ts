import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { validateProblemStructure } from '@/lib/validation';
import {
  extractQuestionsFromPdf,
  paraphraseQuestions,
  verifyQuestions,
  type Q,
} from '@/lib/naesin/extract-paraphrase-service';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 300;

const anthropic = new Anthropic();

/** 업로드 임시 파일 삭제 — 응답을 기다리게 하지 않음 */
function removeTempUpload(storagePath: unknown) {
  if (typeof storagePath !== 'string' || !storagePath) return;
  import('@/lib/supabase/admin').then(({ createAdminClient }) => {
    createAdminClient().storage.from('public-images').remove([storagePath]).catch(() => {});
  });
}

/**
 * PDF 문제지 추출·변형·검산 — 다이얼로그가 phase별로 나눠 호출한다.
 * (215문항급 대형 PDF를 한 요청으로 처리하면 서버리스 타임아웃·동시 호출 한도에 걸림)
 *   phase 'extract'    : PDF → 원본 문항 (절반 추출 적용)
 *   phase 'paraphrase' : 원본 배치 → 변형 문항
 *   phase 'verify'     : 변형 문항 → AI 재풀이 검산 지적 목록
 *   phase 없음         : 레거시 — 추출 + 변형을 한 번에 (소형 PDF용)
 */
export const POST = createApiHandler(
  // 2단계 방식은 추출 1회에 요청 ~12개(extract 1 + paraphrase 배치)가 나가므로
  // 대형 PDF 여러 개를 연달아 돌리는 실사용에 맞춰 상향 (스태프 전용 + naesin 게이트)
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 300 } },
  async ({ user, supabase, request }) => {
    await requireContentPermission(user, supabase);

    try {
      const { unitId, unitTitle, pdfBase64, pdfUrl, storagePath, phase, questions: inputQuestions, halfSampling } = await request.json();

      if (phase === 'paraphrase' || phase === 'verify') {
        if (!unitId || !Array.isArray(inputQuestions) || inputQuestions.length === 0) {
          return NextResponse.json({ error: 'unitId와 questions가 필요합니다.' }, { status: 400 });
        }
        if (phase === 'paraphrase') {
          const { questions, chunkCount } = await paraphraseQuestions(anthropic, inputQuestions as Q[], unitTitle);
          logger.info('ai.paraphrase_batch_done', { unitId, input: inputQuestions.length, output: questions.length, chunks: chunkCount });
          return NextResponse.json({ questions });
        }
        const { issues } = await verifyQuestions(anthropic, inputQuestions as Q[], unitTitle);
        logger.info('ai.verify_batch_done', { unitId, input: inputQuestions.length, issues: issues.length });
        return NextResponse.json({ issues });
      }

      if (!unitId || (!pdfBase64 && !pdfUrl)) {
        return NextResponse.json({ error: 'unitId와 pdfBase64 또는 pdfUrl이 필요합니다.' }, { status: 400 });
      }

      const extracted = await extractQuestionsFromPdf(anthropic, { unitId, pdfBase64, pdfUrl, halfSampling });
      const originalQuestions = extracted.questions;
      if (originalQuestions.length === 0) {
        return NextResponse.json({ error: 'PDF에서 문제를 추출하지 못했습니다.' }, { status: 422 });
      }

      const summary = {
        originalCount: originalQuestions.length,
        extractedTotal: extracted.extractedTotal,
        removedImageCount: extracted.removedImageCount,
      };

      if (phase === 'extract') {
        removeTempUpload(storagePath);
        return NextResponse.json({ questions: originalQuestions, ...summary });
      }

      // ── 레거시 단일 요청 경로: 추출 + 변형을 한 번에 ──
      const { questions: transformed, chunkCount } = await paraphraseQuestions(anthropic, originalQuestions, unitTitle);
      // 청크 순서대로 합친 뒤 일련번호 재부여
      const questions: Q[] = transformed.map((q, i) => ({ ...q, number: i + 1 }));

      const mcqCount = questions.filter((q) => Array.isArray(q.options) && q.options.length > 0).length;
      logger.info('ai.paraphrase_done', {
        original: originalQuestions.length, mcq: mcqCount,
        subjective: questions.length - mcqCount, total: questions.length, chunks: chunkCount, unitId,
      });

      // Layer 1: Structural validation (free, instant)
      const structural = validateProblemStructure(questions as unknown as NaesinProblemQuestion[]);
      removeTempUpload(storagePath);
      return NextResponse.json({ questions, ...summary, validation: { structural } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('ai.extract_paraphrase', { error: msg });
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'PDF 패러프레이징 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }
  },
);
