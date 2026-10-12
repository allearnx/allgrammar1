/**
 * PDF 문제지 → 추출 → 변형(패러프레이즈) → 검산 파이프라인의 AI 호출 계층.
 * extract-paraphrase 라우트는 요청 파싱·phase 분기만 하고 실제 일은 여기서 한다.
 * Anthropic 클라이언트를 인자로 받으므로 테스트는 가짜 클라이언트로 전 경로를 검증할 수 있다.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';
import { logger } from '@/lib/logger';
import { isUnanswerableImageQuestion } from '@/lib/validation/problem-validator';
import { rebuildBankSets } from './word-bank-sets';
import { chunkPreservingGroups, chunkFixed, thinAlternate } from './paraphrase-chunks';
import { buildParaphrasePrompt, buildVerifyPrompt, PARAPHRASE_CHUNK_SIZE, VERIFY_CHUNK_SIZE } from './paraphrase-prompts';
import { splitPdfForExtract } from './split-pdf-for-extract';
import { dedupeExtractedChunks } from './extract-dedupe';
import { buildPdfExtractPrompt } from './extract-prompt';

export type Q = Record<string, unknown>;

/** 실제 Anthropic 인스턴스가 만족하는 최소 표면 — 테스트는 이 모양의 가짜를 넘긴다 */
export interface ExtractAiClient {
  messages: {
    stream(params: Anthropic.MessageStreamParams): { finalMessage(): Promise<Anthropic.Message> };
  };
}

/** 추출은 Haiku(빠른 OCR), 품질이 중요한 변형·검산은 Opus */
export const EXTRACT_MODEL = 'claude-haiku-4-5-20251001';
export const PARAPHRASE_MODEL = 'claude-opus-4-8';

// ── 변형 ──

/** 변형을 청크 단위로 병렬 실행 (지문·word bank 그룹은 경계에서 안 쪼갬) */
export async function paraphraseQuestions(
  ai: ExtractAiClient,
  originals: Q[],
  unitTitle: string,
): Promise<{ questions: Q[]; chunkCount: number }> {
  const chunks = chunkPreservingGroups(originals, PARAPHRASE_CHUNK_SIZE);
  const chunkResults = await Promise.all(
    chunks.map((chunk) =>
      ai.messages.stream({
        model: PARAPHRASE_MODEL,
        max_tokens: 20000,
        messages: [{ role: 'user', content: buildParaphrasePrompt(chunk, unitTitle) }],
      }).finalMessage()
        .then((m) => requireAiJsonArray<Q>(m, 'ai.paraphrase')),
    ),
  );
  // word bank 세트 재조립: 변형된 정답들로 [보기] 상자를 다시 만들어 세트 전 문항에
  // 동일 부착 — "각 단어 1회 정답" 소거법 구조를 프롬프트 준수 여부와 무관하게 보장
  chunkResults.forEach((out, ci) => rebuildBankSets(chunks[ci], out));
  return { questions: chunkResults.flat(), chunkCount: chunks.length };
}

// ── 검산 ──

export interface VerifyIssue {
  number: number;
  verdict: string;
  aiAnswer?: string;
  reason?: string;
}

/** 변형된 문항을 AI가 정답을 가리고 다시 풀어 검산 — wrong/broken 판정만 돌려준다 */
export async function verifyQuestions(
  ai: ExtractAiClient,
  questions: Q[],
  unitTitle: string,
): Promise<{ issues: VerifyIssue[] }> {
  const chunks = chunkFixed(questions, VERIFY_CHUNK_SIZE);
  const chunkResults = await Promise.all(
    chunks.map((chunk) =>
      ai.messages.stream({
        model: PARAPHRASE_MODEL,
        max_tokens: 16000,
        // 검산은 전 선지 대입·개수 세기·배열 검산이 필요해 사고 과정 필수 —
        // thinking 없이는 같은 오류 셋에서 검출이 4~5/6으로 흔들리고, high effort로 6/6 (E2E 2회 확인)
        thinking: { type: 'adaptive' },
        output_config: { effort: 'high' },
        messages: [{ role: 'user', content: buildVerifyPrompt(chunk, unitTitle) }],
      }).finalMessage()
        .then((m) => requireAiJsonArray<VerifyIssue>(m, 'ai.verify')),
    ),
  );
  const issues = chunkResults.flat().filter((r) => r.verdict === 'wrong' || r.verdict === 'broken');
  return { issues };
}

// ── 추출 ──

export interface ExtractInput {
  unitId: string;
  pdfBase64?: string;
  pdfUrl?: string;
  /** false면 전량 유지, 그 외(기본)는 그룹별 교대 추출(thinAlternate) */
  halfSampling?: boolean;
  /** URL PDF 내려받기 — 테스트 주입용. 기본 fetch */
  fetchPdf?: (url: string) => Promise<Uint8Array>;
}

export interface ExtractResult {
  /** 변형 대상 문항 (절반 추출 적용 후) */
  questions: Q[];
  /** 그림 문항 제거 후·절반 추출 전 총 문항 수 */
  extractedTotal: number;
  removedImageCount: number;
  chunkCount: number;
  perChunk: number[];
  deduped: number;
}

const defaultFetchPdf = async (url: string) => new Uint8Array(await (await fetch(url)).arrayBuffer());

/** 추출용 PDF 소스 — URL이면 내려받고, base64면 그대로 (pdf-lib가 base64 문자열을 직접 읽음). 실패 시 null → 통짜 */
async function loadPdfSource(input: ExtractInput): Promise<Uint8Array | string | null> {
  try {
    if (input.pdfUrl) return await (input.fetchPdf ?? defaultFetchPdf)(input.pdfUrl);
    return input.pdfBase64 ?? null;
  } catch {
    return null;
  }
}

/**
 * PDF에서 문항을 추출한다. 큰 PDF는 물리 분할한 조각을 병렬 추출하고(통짜로 시키면 모델이
 * 앞부분만 뽑고 멈춤), 조각 추출이 실패하면 통짜 추출로 폴백. 겹침 중복 제거 → 그림 문항 제외 →
 * 절반 추출 순.
 */
export async function extractQuestionsFromPdf(ai: ExtractAiClient, input: ExtractInput): Promise<ExtractResult> {
  const { unitId, pdfBase64, pdfUrl } = input;

  const documentBlock = pdfUrl
    ? { type: 'document' as const, source: { type: 'url' as const, url: pdfUrl } }
    : { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: pdfBase64 as string } };

  const pdfSource = await loadPdfSource(input);
  const chunkDocs = pdfSource ? await splitPdfForExtract(pdfSource) : null;

  const extractChunk = (chunkBase64: string | null) => ai.messages.stream({
    model: EXTRACT_MODEL,
    max_tokens: 32000,
    messages: [{
      role: 'user',
      content: [
        chunkBase64
          ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: chunkBase64 } }
          : documentBlock,
        { type: 'text', text: buildPdfExtractPrompt(chunkBase64 !== null) },
      ],
    }],
  }).finalMessage()
    .then((m) => requireAiJsonArray<Q>(m, 'ai.extract'));

  let extractedChunks: Q[][];
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

  // 겹침 페이지 중복 안전장치
  const { questions: extractedQuestions, deduped } = dedupeExtractedChunks(extractedChunks);
  const perChunk = extractedChunks.map((c) => c.length);
  logger.info('ai.extract_chunks', { unitId, chunks: extractedChunks.length, perChunk, deduped });

  // 그림·사진을 봐야만 풀 수 있는 문항은 변형 대상에서 제외 (화면에서 풀 수 없음)
  const filtered = extractedQuestions.filter((q) => !isUnanswerableImageQuestion(String(q.question ?? '')));
  const removedImageCount = extractedQuestions.length - filtered.length;

  // 절반 추출: 그룹별 교대 유지 (대량 드릴 자료의 문항 수 절반화 — 옵트아웃 가능)
  const questions = input.halfSampling === false ? filtered : thinAlternate(filtered);
  logger.info('ai.extract_done', {
    count: questions.length, extractedTotal: filtered.length, removedImageCount,
    halfSampling: input.halfSampling !== false, unitId,
  });

  return { questions, extractedTotal: filtered.length, removedImageCount, chunkCount: extractedChunks.length, perChunk, deduped };
}
