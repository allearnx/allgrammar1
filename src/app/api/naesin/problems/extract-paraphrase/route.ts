import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';
import { validateProblemStructure } from '@/lib/validation';
import { isUnanswerableImageQuestion } from '@/lib/validation/problem-validator';
import { rebuildBankSets } from '@/lib/naesin/word-bank-sets';
import { chunkPreservingGroups, thinAlternate } from '@/lib/naesin/paraphrase-chunks';
import { buildParaphrasePrompt, buildVerifyPrompt, PARAPHRASE_CHUNK_SIZE, VERIFY_CHUNK_SIZE } from '@/lib/naesin/paraphrase-prompts';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 300;

const anthropic = new Anthropic();

/**
 * 추출 시 한 조각당 페이지 수 — 큰 PDF를 통짜로 추출시키면 모델이
 * 앞 몇 페이지만 뽑고 멈춤 (30페이지 워크북에서 17문항만 추출된 실사례).
 * 프롬프트로 "N~M페이지만" 지정하는 방식은 모델이 페이지 위치를 못 짚어 실패
 * (E2E 확인) → pdf-lib로 물리 분할해 조각만 보낸다. 경계에 걸친 문항을 위해
 * 조각끼리 1페이지씩 겹치고, 잘린 문항은 프롬프트 지시 + 코드 dedup으로 정리.
 */
const EXTRACT_PAGES_PER_CHUNK = 6;

/**
 * PDF를 6페이지(1페이지 겹침) base64 조각들로 물리 분할.
 * 분할이 불가능하면(암호화·손상·작은 문서) null — 통짜 추출로 폴백.
 */
async function splitPdfForExtract(pdfBase64?: string, pdfUrl?: string): Promise<string[] | null> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const bytes = pdfUrl
      ? new Uint8Array(await (await fetch(pdfUrl)).arrayBuffer())
      : pdfBase64!;
    const src = await PDFDocument.load(bytes); // 암호화면 throw → 통짜 폴백
    const total = src.getPageCount();
    if (total <= EXTRACT_PAGES_PER_CHUNK) return null;
    const chunks: string[] = [];
    for (let start = 0; start < total; start += EXTRACT_PAGES_PER_CHUNK - 1) {
      const end = Math.min(start + EXTRACT_PAGES_PER_CHUNK, total);
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, Array.from({ length: end - start }, (_, i) => start + i));
      for (const p of pages) doc.addPage(p);
      chunks.push(Buffer.from(await doc.save()).toString('base64'));
      if (end >= total) break;
    }
    return chunks;
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
    const { unitId, unitTitle, pdfBase64, mediaType, pdfUrl, storagePath, phase, questions: inputQuestions, halfSampling } = await request.json();

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
      const chunks: Record<string, unknown>[][] = [];
      for (let i = 0; i < inputQuestions.length; i += VERIFY_CHUNK_SIZE) {
        chunks.push(inputQuestions.slice(i, i + VERIFY_CHUNK_SIZE));
      }
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
    const chunkDocs = await splitPdfForExtract(pdfBase64, pdfUrl);

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
              text: `이 PDF는 중·고등학교 영어 시험 문제지${chunkBase64 ? '의 일부 조각입니다 (앞뒤 조각과 1페이지씩 겹침)' : '입니다'}.
모든 문법 문제를 빠짐없이 추출하세요.${chunkBase64 ? `
- 첫 페이지가 이전 조각에서 이어진 내용으로 시작하면(문항의 지시문·시작이 안 보이면) 그 잘린 문항은 제외 (이전 조각에서 추출됨)
- 마지막 페이지에서 시작했지만 끝이 잘려 완전하지 않은 문항도 제외 (다음 조각에서 추출됨)
- 조각에 문제가 하나도 없으면(설명·해설·목차뿐이면) 빈 배열 []로 응답` : ''}
JSON 배열로만 응답 (다른 텍스트 없이):
[
  {
    "number": 1,
    "question": "문제 텍스트",
    "options": ["보기1", "보기2", "보기3", "보기4", "보기5"],
    "answer": "정답",
    "type": "객관식"
  },
  {
    "number": 2,
    "question": "서술형 문제 텍스트",
    "options": null,
    "answer": "정답 텍스트",
    "type": "서술형"
  }
]

규칙:
- 객관식: options 배열에 보기(①② 같은 번호 접두사 없이 내용만), answer에 정답 번호 또는 텍스트
- 서술형: options는 null, answer에 정답 텍스트
- **★객관식 판별 주의: 문제에 ①~⑤ 선다형 선택지가 실제로 인쇄된 경우에만 객관식.**
  아래는 전부 서술형(options: null)으로 추출할 것:
  · 보기 상자(word bank)에서 단어를 골라 빈칸 채우기 → options에 넣지 말고, 보기 단어들을
    question 앞에 "[보기] fresh / clean / famous" 형태로 포함, answer는 정답 단어.
    **같은 보기 상자를 공유하는 모든 문항에 똑같은 [보기] 줄을 각각 복제**할 것
  · 밑줄 치시오·고치시오·배열하시오 등 지시형
- **2택 고르기는 2지선다 객관식으로 추출**: "(A / B)" 괄호 선택이나 "□ A □ B" 박스 선택은
  괄호·박스를 question에서 빼고 그 자리를 빈칸(______)으로 바꾼 뒤, options에 두 선택지만
  넣고 answer는 정답 번호(1~2). 예: "I made my dad (angry / angrily)." →
  question "I made my dad ______.", options ["angry", "angrily"]
- **그림·사진·지도·그래프를 봐야만 풀 수 있는 문항은 추출하지 말 것** (화면에 이미지를
  옮길 수 없어 학생이 못 풂). 단, 글자·숫자로 된 표는 마크다운 파이프 표로 재현해 문항 유지
- **★각 문항은 학생 화면에 한 문제씩 단독 표시됨**: 모든 문항의 question은 그것만 보고
  무엇을 해야 하는지 알 수 있어야 함. 공통 지시문("다음 문장을 의문문으로 바꾸시오" 등)은
  묶음의 **모든 문항 question 맨 앞에 각각 복제**할 것 — 지시문 없이 문장·빈칸만 남기는 것 금지.
  서술형에서 답 형식이 특별하면 "※ 예시: ..." 형식 안내, 보기 상자는 "[보기] ..."를 문항마다 포함
- **원본 문항 번호를 question 텍스트에 넣지 말 것**: 번호는 number 필드에만. 하나의 지시문
  아래 "7. ___ / 8. ___"처럼 번호 항목이 이어지는 형식이면, 각 문항의 question은 지시문 +
  해당 항목 내용만 담고 "7." 같은 번호 접두사는 제거할 것 (시트가 번호를 새로 매기므로
  본문에 남으면 화면 번호와 이중으로 어긋남)
- 위 제외 대상 외 모든 문제를 빠짐없이 추출
- **★공통 지문 필수 복제:** "[4~6] 다음 글을 읽고 물음에 답하시오" 같은 번호 범위 머리글 아래 지문·대화가 한 번만 인쇄되고 여러 문제가 딸린 경우, 그 지문(대화·요약·표 포함)을 범위 내 모든 문제의 question 앞에 각각 복제하세요. 지문 속 ⓐ~ⓕ/㉠~㉤/(A)~(C) 마커가 있으면 그대로 보존. "위 글/위 대화/윗글"을 가리키는 문제는 반드시 자기 question에 지문 전체를 포함해야 합니다(참조만 두면 학생이 못 풉니다).`,
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
    // 겹침 페이지 중복 안전장치 — 두 조각이 같은 문항을 추출하면 지시문·각주 번호
    // ("early.1)") 유무로 텍스트가 달라지므로, 영문 본문 꼬리 + 정답 + 보기로 비교
    const dedupKey = (q: Record<string, unknown>) => {
      const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      // 영문 단어(2자 이상)만 이어붙임 — 한글 지시문 속 낱글자(O/X)·각주 숫자를 배제
      const en = (String(q.question ?? '').match(/[a-zA-Z]{2,}/g) || []).join('').toLowerCase();
      const base = en.length >= 15 ? en.slice(-80) : norm(q.question).slice(-80);
      const opts = Array.isArray(q.options) ? norm(q.options.join('')).slice(0, 80) : '';
      return `${base}|${norm(q.answer)}|${opts}`;
    };
    const seenKeys = new Set<string>();
    const extractedQuestions = extractedChunks.flat().filter((q) => {
      const k = dedupKey(q);
      if (seenKeys.has(k)) return false;
      seenKeys.add(k);
      return true;
    });
    logger.info('ai.extract_chunks', {
      unitId, chunks: extractedChunks.length,
      perChunk: extractedChunks.map((c) => c.length), deduped: extractedChunks.flat().length - extractedQuestions.length,
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
