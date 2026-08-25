import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';
import { validateProblemStructure } from '@/lib/validation';
import { isUnanswerableImageQuestion } from '@/lib/validation/problem-validator';
import { sameBank, rebuildBankSets } from '@/lib/naesin/word-bank-sets';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 300;

const anthropic = new Anthropic();

/** 청크당 원본 문항 수 — 출력 잘림 방지 + 병렬 처리 단위 */
const PARAPHRASE_CHUNK_SIZE = 12;

/** 연속 문항이 같은 공통 지문/보기 상자를 공유하는지 */
function sharesPassage(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  // word bank 세트: 보기 단어 집합이 같으면 같은 세트 (소거법 유지 위해 안 쪼갬)
  if (sameBank(a, b)) return true;
  // 공통 지문: 긴 공통 접두사 휴리스틱
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
- **유형 유지**: 원본이 객관식(options 있음)이면 **같은 선택지 수**의 객관식(2지선다는 2개, 5지선다는 5개, answer는 정답 번호), 원본이 서술형(options 없음)이면 서술형(options는 null, answer는 정답 텍스트)
- **options에는 보기 내용만**: ①②③/1./1) 같은 번호 접두사를 붙이지 말 것 (화면이 번호를 자동 표시). 원본 보기에 번호가 붙어 있어도 떼고 내용만 넣을 것
- **word bank 빈칸 채우기를 객관식으로 바꾸지 말 것** — 서술형 그대로 유지, "[보기] ..." 형태로 question에 포함하고 answer는 정답 단어/형태만. 2지선다(원본 options 2개)는 2지선다 그대로 유지
- **word bank 세트 유지**: 같은 보기 상자를 공유하는 연속 문항들은 변형 후에도 **똑같은 "[보기] ..." 첫 줄을 공유**하는 세트로 유지하고, **각 보기 단어가 세트 안에서 정확히 한 문항의 정답**이 되게 문장을 설계할 것 (원본처럼 학생이 소거법으로 풀 수 있어야 함). 각 문장은 자기 정답 단어와 가장 자연스럽게 어울려야 하고, 다른 문항의 정답 단어가 더 잘 어울리면 안 됨
- **1:1 변형**: 각 문제가 묻는 문법 포인트와 문제 형식(빈칸/어법 판단/용법 구별/영작/어순 배열/오류 수정 등)은 원본 그대로 유지하고, 문장·어휘·소재·상황만 새로 바꿀 것. 원본 문장을 그대로 복사하지 말 것
- **★의도된 오류 보존 (어법 판단·틀린 문장 고르기·오류 수정 문항)**: 원본에서 "틀리게 설계된 문장"은 변형 후에도 **같은 유형의 오류를 가진 틀린 문장**이어야 함. 변형하면서 문법을 교정해 버리면 정답이 사라짐(예: 정답 보기가 "how much is it"처럼 틀려야 하는데 "how much it is"로 고쳐 쓰면 문제 붕괴). 변형 완료 후 각 문항을 다시 풀어 정답 번호·개수·조합이 성립하는지 반드시 자체 검산할 것
- **공통 지문 유지**: 지문이 딸린 문제는 지문도 같은 구조·비슷한 길이로 패러프레이즈. 같은 지문을 공유하는 연속 문제들은 패러프레이즈된 지문도 서로 완전히 동일해야 함. 지문 속 ⓐ~ⓔ/(A)~(E)/㉠~㉤ 마커는 그대로 보존
- **밑줄·강조 보존**: "밑줄 친 부분/단어"를 묻는 문항은 패러프레이즈한 문장에서도 그 대상을 <u>...</u> 태그로 반드시 감싸세요(어휘 동의어 문항은 보기 속 단어도). 안 하면 학생이 어디가 밑줄인지 몰라 못 풉니다.
- 객관식 정답 번호는 원본과 달라도 되며, 특정 번호에 몰리지 않게
- **서술형에서 "자유롭게 작성"류 문항 금지.** 자유 작문은 정답이 무한이라 자동채점 불가(학생이 맞게 써도 오답). 항상 구체적 문장으로 제시해 정답이 하나로 결정되게 할 것
- **서술형 정답이 완전한 문장이면 지시문에 출력 형식을 반드시 명시할 것** (예: " ※ 완전한 문장으로 쓰시오."). 학생이 일부만 써서 오답 처리되지 않게
- **오류 수정형은 전체 문장 다시 쓰기로 출제**: question 끝에 " ※ 틀린 부분을 고쳐서 올바른 문장으로 전부 쓰세요."를 넣고, answer는 **고친 전체 문장**(예: "The speech made the students bored."). "고친 부분만 쓰시오" 방식이나 "틀린형 / 고친형"·"boring → bored" 같은 쌍 표기 금지
- **정답 형식이 특별하면 문제에 예시를 보여줄 것**: 정답이 단어 하나·문장 하나가 아닌 형식(두 요소를 쉼표로 "upset, 형용사" / 기호+단어 / 복수 답 등)이면 question 끝에 **같은 형식의 예시**를 넣어 학생이 보고 따라 쓰게 할 것 (예: " ※ 예시와 같은 형식으로 쓰세요 → 예시: brave, 형용사"). 예시 내용은 정답과 다른 것으로
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
- 위 제외 대상 외 모든 문제를 빠짐없이 추출
- **★공통 지문 필수 복제:** "[4~6] 다음 글을 읽고 물음에 답하시오" 같은 번호 범위 머리글 아래 지문·대화가 한 번만 인쇄되고 여러 문제가 딸린 경우, 그 지문(대화·요약·표 포함)을 범위 내 모든 문제의 question 앞에 각각 복제하세요. 지문 속 ⓐ~ⓕ/㉠~㉤/(A)~(C) 마커가 있으면 그대로 보존. "위 글/위 대화/윗글"을 가리키는 문제는 반드시 자기 question에 지문 전체를 포함해야 합니다(참조만 두면 학생이 못 풉니다).`,
            },
          ],
        },
      ],
    }).finalMessage();

    const extractedQuestions = requireAiJsonArray<Record<string, unknown>>(extractMessage, 'ai.extract');

    // 그림·사진을 봐야만 풀 수 있는 문항은 패러프레이즈 대상에서 제외 (화면에서 풀 수 없음)
    const originalQuestions = extractedQuestions.filter(
      (q) => !isUnanswerableImageQuestion(String(q.question ?? '')),
    );
    const removedImageCount = extractedQuestions.length - originalQuestions.length;
    logger.info('ai.extract_done', { count: originalQuestions.length, removedImageCount, unitId });

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

    // word bank 세트 재조립: 변형된 정답들로 [보기] 상자를 다시 만들어 세트 전 문항에
    // 동일 부착 — "각 단어 1회 정답" 소거법 구조를 프롬프트 준수 여부와 무관하게 보장
    chunkResults.forEach((out, ci) => rebuildBankSets(chunks[ci], out));

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

    return NextResponse.json({
      questions,
      originalCount: originalQuestions.length,
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
