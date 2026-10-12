import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';
import { validateProblemStructure } from '@/lib/validation';
import { isUnanswerableImageQuestion } from '@/lib/validation/problem-validator';
import { rebuildBankSets } from '@/lib/naesin/word-bank-sets';
import { chunkPreservingGroups, chunkFixed, thinAlternate } from '@/lib/naesin/paraphrase-chunks';
import { splitPdfForExtract } from '@/lib/naesin/split-pdf-for-extract';
import { dedupeExtractedChunks } from '@/lib/naesin/extract-dedupe';
import { buildPdfExtractPrompt } from '@/lib/naesin/extract-prompt';
import { buildParaphrasePrompt, buildVerifyPrompt, PARAPHRASE_CHUNK_SIZE, VERIFY_CHUNK_SIZE } from '@/lib/naesin/paraphrase-prompts';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 300;

const anthropic = new Anthropic();

/** 추출용 PDF 소스를 바이트로 — URL이면 내려받고, base64면 그대로 (pdf-lib가 base64 문자열을 직접 읽음) */
async function loadPdfSource(pdfBase64?: string, pdfUrl?: string): Promise<Uint8Array | string | null> {
  try {
    return pdfUrl ? new Uint8Array(await (await fetch(pdfUrl)).arrayBuffer()) : pdfBase64!;
  } catch {
    return null;
  }
}

export const POST = createApiHandler(
  // 2단계 방식은 추출 1회에 요청 ~12개(extract 1 + paraphrase 배치)가 나가므로
  // 대형 PDF 여러 개를 연달아 돌리는 실사용에 맞춰 상향 (스태프 전용 + naesin 게이트)
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 300 } },
  async ({ user, supabase, request }) => {
  await requireContentPermission(user, supabase);

  try {
    const { unitId, unitTitle, pdfBase64, pdfUrl, storagePath, phase, questions: inputQuestions, halfSampling } = await request.json();

    // 변형을 청크 단위로 병렬 실행 (지문·word bank 그룹은 경계에서 안 쪼갬)
    const paraphraseQuestions = async (originals: Record<string, unknown>[]) => {
      const chunks = chunkPreservingGroups(originals, PARAPHRASE_CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunks.map((chunk) =>
          anthropic.messages.stream({
            model: 'claude-opus-4-8',
            max_tokens: 20000,
            messages: [
              { role: 'user', content: buildParaphrasePrompt(chunk, unitTitle) },
            ],
          }).finalMessage()
            .then((m) => requireAiJsonArray<Record<string, unknown>>(m, 'ai.paraphrase')),
        ),
      );
      // word bank 세트 재조립: 변형된 정답들로 [보기] 상자를 다시 만들어 세트 전 문항에
      // 동일 부착 — "각 단어 1회 정답" 소거법 구조를 프롬프트 준수 여부와 무관하게 보장
      chunkResults.forEach((out, ci) => rebuildBankSets(chunks[ci], out));
      return { questions: chunkResults.flat(), chunkCount: chunks.length };
    };

    // ── phase 'paraphrase': 추출된 원본 배치를 변형만 해서 반환 ──
    // (215문항급 대형 PDF를 한 요청으로 처리하면 서버리스 타임아웃·동시 호출 한도에
    //  걸리므로, 다이얼로그가 추출 1회 + 변형 여러 요청으로 나눠 호출한다)
    if (phase === 'paraphrase') {
      if (!unitId || !Array.isArray(inputQuestions) || inputQuestions.length === 0) {
        return NextResponse.json({ error: 'unitId와 questions가 필요합니다.' }, { status: 400 });
      }
      const { questions: out, chunkCount } = await paraphraseQuestions(inputQuestions as Record<string, unknown>[]);
      logger.info('ai.paraphrase_batch_done', { unitId, input: inputQuestions.length, output: out.length, chunks: chunkCount });
      return NextResponse.json({ questions: out });
    }

    // ── phase 'verify': 변형된 문항을 AI가 정답을 가리고 다시 풀어 검산 ──
    // 변형 과정의 정답 오류(비문 정답·유일성 붕괴·조건 불일치)는 코드로 못 잡으므로
    // 저장 전에 자동 검산해 지적 문항을 미리보기 패널에 띄운다 (다이얼로그가 배치 호출)
    if (phase === 'verify') {
      if (!unitId || !Array.isArray(inputQuestions) || inputQuestions.length === 0) {
        return NextResponse.json({ error: 'unitId와 questions가 필요합니다.' }, { status: 400 });
      }
      const chunks = chunkFixed(inputQuestions as Record<string, unknown>[], VERIFY_CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunks.map((chunk) =>
          anthropic.messages.stream({
            model: 'claude-opus-4-8',
            max_tokens: 16000,
            // 검산은 전 선지 대입·개수 세기·배열 검산이 필요해 사고 과정 필수 —
            // thinking 없이는 같은 오류 셋에서 검출이 4~5/6으로 흔들리고, high effort로 6/6 (E2E 2회 확인)
            thinking: { type: 'adaptive' },
            output_config: { effort: 'high' },
            messages: [{ role: 'user', content: buildVerifyPrompt(chunk, unitTitle) }],
          }).finalMessage()
            .then((m) => requireAiJsonArray<{ number: number; verdict: string; aiAnswer?: string; reason?: string }>(m, 'ai.verify')),
        ),
      );
      const issues = chunkResults.flat().filter((r) => r.verdict === 'wrong' || r.verdict === 'broken');
      logger.info('ai.verify_batch_done', { unitId, input: inputQuestions.length, issues: issues.length });
      return NextResponse.json({ issues });
    }

    if (!unitId || (!pdfBase64 && !pdfUrl)) {
      return NextResponse.json({ error: 'unitId와 pdfBase64 또는 pdfUrl이 필요합니다.' }, { status: 400 });
    }

    // Document source: URL 또는 base64
    const documentBlock = pdfUrl
      ? { type: 'document' as const, source: { type: 'url' as const, url: pdfUrl as string } }
      : { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: pdfBase64 as string } };

    // Step 1: Extract problems from PDF (Haiku — fast OCR, quality-critical paraphrasing uses Opus)
    // 큰 PDF는 물리 분할한 조각을 병렬 추출 (통짜로 시키면 모델이 앞부분만 뽑고 멈춤).
    const pdfSource = await loadPdfSource(pdfBase64, pdfUrl);
    const chunkDocs = pdfSource ? await splitPdfForExtract(pdfSource) : null;

    const extractChunk = (chunkBase64: string | null) => anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 32000,
      messages: [
        {
          role: 'user',
          content: [
            chunkBase64
              ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: chunkBase64 } }
              : documentBlock,
            {
              type: 'text',
              text: buildPdfExtractPrompt(chunkBase64 !== null),
            },
          ],
        },
      ],
    }).finalMessage()
      .then((m) => requireAiJsonArray<Record<string, unknown>>(m, 'ai.extract'));

    let extractedChunks: Record<string, unknown>[][];
    if (chunkDocs) {
      try {
        extractedChunks = await Promise.all(chunkDocs.map((c) => extractChunk(c)));
      } catch {
        // 분할 조각 추출 실패(깨진 조각 등) → 통짜 추출로 폴백
        logger.warn('ai.extract_chunks_fallback', { unitId, chunks: chunkDocs.length });
        extractedChunks = [await extractChunk(null)];
      }
    } else {
      extractedChunks = [await extractChunk(null)];
    }
    // 겹침 페이지 중복 안전장치 (lib/naesin/extract-dedupe.ts)
    const { questions: extractedQuestions, deduped } = dedupeExtractedChunks(extractedChunks);
    logger.info('ai.extract_chunks', {
      unitId, chunks: extractedChunks.length, perChunk: extractedChunks.map((c) => c.length), deduped,
    });

    // 그림·사진을 봐야만 풀 수 있는 문항은 패러프레이즈 대상에서 제외 (화면에서 풀 수 없음)
    const filteredQuestions = extractedQuestions.filter(
      (q) => !isUnanswerableImageQuestion(String(q.question ?? '')),
    );
    const removedImageCount = extractedQuestions.length - filteredQuestions.length;

    // 절반 추출: 그룹별 1·3·5번째만 유지 (대량 드릴 자료의 문항 수 절반화 — 옵트아웃 가능)
    const originalQuestions = halfSampling === false ? filteredQuestions : thinAlternate(filteredQuestions);
    const extractedTotal = filteredQuestions.length;
    logger.info('ai.extract_done', {
      count: originalQuestions.length, extractedTotal, removedImageCount,
      halfSampling: halfSampling !== false, unitId,
    });

    if (originalQuestions.length === 0) {
      return NextResponse.json({ error: 'PDF에서 문제를 추출하지 못했습니다.' }, { status: 422 });
    }

    // ── phase 'extract': 원본 추출 결과만 반환 (변형은 후속 요청들이 배치로) ──
    if (phase === 'extract') {
      if (storagePath) {
        import('@/lib/supabase/admin').then(({ createAdminClient }) => {
          createAdminClient().storage.from('public-images').remove([storagePath]).catch(() => {});
        });
      }
      return NextResponse.json({
        questions: originalQuestions,
        originalCount: originalQuestions.length,
        extractedTotal,
        removedImageCount,
      });
    }

    // ── 레거시 단일 요청 경로: 추출 + 변형을 한 번에 (소형 PDF용) ──
    const { questions: transformed, chunkCount } = await paraphraseQuestions(originalQuestions);

    // 청크 순서대로 합친 뒤 일련번호 재부여
    const questions: Record<string, unknown>[] = transformed.map((q, i) => ({ ...q, number: i + 1 }));

    const mcqCount = questions.filter((q) => Array.isArray(q.options) && q.options.length > 0).length;
    logger.info('ai.paraphrase_done', {
      original: originalQuestions.length, mcq: mcqCount,
      subjective: questions.length - mcqCount, total: questions.length, chunks: chunkCount, unitId,
    });

    // Layer 1: Structural validation (free, instant)
    const structural = validateProblemStructure(questions as unknown as NaesinProblemQuestion[]);

    // Storage 임시 파일 삭제
    if (storagePath) {
      import('@/lib/supabase/admin').then(({ createAdminClient }) => {
        createAdminClient().storage.from('public-images').remove([storagePath]).catch(() => {});
      });
    }

    return NextResponse.json({
      questions,
      originalCount: originalQuestions.length,
      extractedTotal,
      removedImageCount,
      validation: { structural },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('ai.extract_paraphrase', { error: msg });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF 패러프레이징 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
  }
);
