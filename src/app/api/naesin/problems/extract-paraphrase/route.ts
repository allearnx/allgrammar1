import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';
import { validateProblemStructure } from '@/lib/validation';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 300;

const anthropic = new Anthropic();

/** 청크당 원본 문항 수 — 출력 잘림 방지 + 병렬 처리 단위 */
const PARAPHRASE_CHUNK_SIZE = 12;

/** 연속 문항이 같은 공통 지문을 공유하는지 (긴 공통 접두사 휴리스틱) */
function sharesPassage(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const qa = String(a?.question ?? '');
  const qb = String(b?.question ?? '');
  if (qa.length < 120 || qb.length < 120) return false;
  return qa.slice(0, 100) === qb.slice(0, 100);
}

/** 청크 분할 — 같은 지문을 공유하는 연속 문항 그룹은 경계에서 쪼개지 않음 */
function chunkPreservingGroups(qs: Record<string, unknown>[], size: number): Record<string, unknown>[][] {
  const chunks: Record<string, unknown>[][] = [];
  let i = 0;
  while (i < qs.length) {
    let end = Math.min(i + size, qs.length);
    while (end < qs.length && sharesPassage(qs[end - 1], qs[end])) end++;
    chunks.push(qs.slice(i, end));
    i = end;
  }
  return chunks;
}

function buildParaphrasePrompt(chunk: Record<string, unknown>[], unitTitle: string) {
  return `아래는 중학교 영어 시험에서 추출한 원본 문제들입니다:

${JSON.stringify(chunk, null, 2)}

위 원본 문제를 **하나도 빠짐없이 1:1로 패러프레이즈**하세요.
문제를 합치거나, 빼거나, 새로 추가하지 마세요. 원본이 ${chunk.length}문제이므로 정확히 ${chunk.length}문제를 반환해야 합니다.
문법 주제: ${unitTitle || '중학 영어 문법'}

각 문제 형식 (JSON 배열로만 응답):
[
  {
    "number": 1,
    "question": "문제 텍스트",
    "options": ["보기1", "보기2", "보기3", "보기4", "보기5"] 또는 null,
    "answer": "정답",
    "explanation": "해설"
  }
]

규칙:
- **유형 유지**: 원본이 객관식(options 있음)이면 객관식 5지선다(answer는 정답 번호 1~5), 원본이 서술형(options 없음)이면 서술형(options는 null, answer는 정답 텍스트)
- **options에는 보기 내용만**: ①②③/1./1) 같은 번호 접두사를 붙이지 말 것 (화면이 번호를 자동 표시). 원본 보기에 번호가 붙어 있어도 떼고 내용만 넣을 것
- **1:1 변형**: 각 문제가 묻는 문법 포인트와 문제 형식(빈칸/어법 판단/용법 구별/영작/어순 배열/오류 수정 등)은 원본 그대로 유지하고, 문장·어휘·소재·상황만 새로 바꿀 것. 원본 문장을 그대로 복사하지 말 것
- **공통 지문 유지**: 지문이 딸린 문제는 지문도 같은 구조·비슷한 길이로 패러프레이즈. 같은 지문을 공유하는 연속 문제들은 패러프레이즈된 지문도 서로 완전히 동일해야 함. 지문 속 ⓐ~ⓔ/(A)~(E)/㉠~㉤ 마커는 그대로 보존
- **밑줄·강조 보존**: "밑줄 친 부분/단어"를 묻는 문항은 패러프레이즈한 문장에서도 그 대상을 <u>...</u> 태그로 반드시 감싸세요(어휘 동의어 문항은 보기 속 단어도). 안 하면 학생이 어디가 밑줄인지 몰라 못 풉니다.
- 객관식 정답 번호는 원본과 달라도 되며, 특정 번호에 몰리지 않게
- **서술형에서 "자유롭게 작성"류 문항 금지.** 자유 작문은 정답이 무한이라 자동채점 불가(학생이 맞게 써도 오답). 항상 구체적 문장으로 제시해 정답이 하나로 결정되게 할 것
- **서술형 정답이 완전한 문장이면 지시문에 출력 형식을 반드시 명시할 것.** 특히 오류 수정형은 "고쳐 쓰시오"로 끝내지 말고 "전체 문장을 바르게 고쳐 쓰시오" 또는 " ※ 완전한 문장으로 쓰시오."를 넣어, 학생이 일부만 써서 오답 처리되지 않게 할 것
- **오류 수정형의 answer는 "고친 형태"만(고친 단어/구 또는 전체 고친 문장).** "틀린단어 / 고친단어" 쌍(예: "be / is")으로 만들지 말 것 — 슬래시가 빈칸 분할로 오인됨. question 끝에 " ※ 고친 부분만 쓰시오." 안내, 정답 후보 여럿이면 acceptedAnswers로
- 중학생 수준에 적합한 난이도
- number는 원본의 number를 그대로 유지`;
}

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 30 } },
  async ({ user, supabase, request }) => {
  await requireContentPermission(user, supabase);

  try {
    const { unitId, unitTitle, pdfBase64, mediaType, pdfUrl, storagePath } = await request.json();

    if (!unitId || (!pdfBase64 && !pdfUrl)) {
      return NextResponse.json({ error: 'unitId와 pdfBase64 또는 pdfUrl이 필요합니다.' }, { status: 400 });
    }

    // Document source: URL 또는 base64
    const documentBlock = pdfUrl
      ? { type: 'document' as const, source: { type: 'url' as const, url: pdfUrl as string } }
      : { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: pdfBase64 as string } };

    // Step 1: Extract problems from PDF (Haiku — fast OCR, quality-critical paraphrasing uses Opus)
    // 공통 지문 복제로 출력이 길어질 수 있어 넉넉한 한도 + 스트리밍 (Haiku 출력 상한 64k)
    const extractMessage = await anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 32000,
      messages: [
        {
          role: 'user',
          content: [
            documentBlock,
            {
              type: 'text',
              text: `이 PDF는 중학교 영어 시험 문제지입니다.
모든 문법 문제를 추출하세요. JSON 배열로만 응답 (다른 텍스트 없이):
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
- 모든 문제를 빠짐없이 추출
- **★공통 지문 필수 복제:** "[4~6] 다음 글을 읽고 물음에 답하시오" 같은 번호 범위 머리글 아래 지문·대화가 한 번만 인쇄되고 여러 문제가 딸린 경우, 그 지문(대화·요약·표 포함)을 범위 내 모든 문제의 question 앞에 각각 복제하세요. 지문 속 ⓐ~ⓕ/㉠~㉤/(A)~(C) 마커가 있으면 그대로 보존. "위 글/위 대화/윗글"을 가리키는 문제는 반드시 자기 question에 지문 전체를 포함해야 합니다(참조만 두면 학생이 못 풉니다).`,
            },
          ],
        },
      ],
    }).finalMessage();

    const originalQuestions = requireAiJsonArray<Record<string, unknown>>(extractMessage, 'ai.extract');
    logger.info('ai.extract_done', { count: originalQuestions.length, unitId });

    if (originalQuestions.length === 0) {
      return NextResponse.json({ error: 'PDF에서 문제를 추출하지 못했습니다.' }, { status: 422 });
    }

    // Step 2: 원본 1:1 패러프레이즈 — 문항 수·유형·순서를 원본 그대로 유지.
    // 지문 그룹이 안 쪼개지게 청크로 나눠 병렬 실행 (출력 잘림 방지 겸용)
    const chunks = chunkPreservingGroups(originalQuestions, PARAPHRASE_CHUNK_SIZE);
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

    // 청크 순서대로 합친 뒤 일련번호 재부여
    const questions: Record<string, unknown>[] = chunkResults
      .flat()
      .map((q, i) => ({ ...q, number: i + 1 }));

    const mcqCount = questions.filter((q) => Array.isArray(q.options) && q.options.length > 0).length;
    logger.info('ai.paraphrase_done', {
      original: originalQuestions.length, mcq: mcqCount,
      subjective: questions.length - mcqCount, total: questions.length, chunks: chunks.length, unitId,
    });

    // Layer 1: Structural validation (free, instant)
    const structural = validateProblemStructure(questions as unknown as NaesinProblemQuestion[]);

    // Storage 임시 파일 삭제
    if (storagePath) {
      import('@/lib/supabase/admin').then(({ createAdminClient }) => {
        createAdminClient().storage.from('public-images').remove([storagePath]).catch(() => {});
      });
    }

    return NextResponse.json({ questions, originalCount: originalQuestions.length, validation: { structural } });
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
