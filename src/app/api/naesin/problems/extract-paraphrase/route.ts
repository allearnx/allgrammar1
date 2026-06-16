import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';
import { validateProblemStructure } from '@/lib/validation';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 300;

const anthropic = new Anthropic();

const MCQ_DISTRIBUTION = `
| 유형 | 개수 | 형식 |
|------|------|------|
| 빈칸 채우기 | 10 | 객관식 5지선다 |
| 영작 선택 | 5 | 객관식 5지선다 |
| 용법 구별 | 10 | 객관식 5지선다 |
| 어법 판단 | 7 | 객관식 5지선다 |
총 32문제 (number 1~32)`;

const SUBJECTIVE_DISTRIBUTION = `
| 유형 | 개수 | 형식 |
|------|------|------|
| 서술형 — 영작 | 8 | 서술형 (options 없음) |
| 서술형 — 어순 배열 | 5 | 서술형 (options 없음) |
| 서술형 — 오류 수정 | 5 | 서술형 (options 없음) |
총 18문제 (number 33~50)`;

function buildParaphrasePrompt(
  originalQuestions: unknown[],
  unitTitle: string,
  distribution: string,
  questionType: 'mcq' | 'subjective',
) {
  const typeRules = questionType === 'mcq'
    ? `- options에 5지선다 (① ② ③ ④ ⑤), answer에 정답 번호(1~5)
- 정답 번호가 1~5에 골고루 분포하도록 (각 6~7개). 특정 번호에 몰리지 않게 할 것
- 유형 표시: [빈칸 채우기], [영작 선택], [용법 구별], [어법 판단]`
    : `- options는 null, answer에 정답 텍스트
- 유형 표시: [서술형-영작], [서술형-어순 배열], [서술형-오류 수정]
- **결합/연결 문항에서 [B](또는 빈 부분)를 "자유롭게 작성"하라고 하지 말 것.** 자유 작문은 정답이 무한이라 자동채점 불가(학생이 맞게 써도 오답). 항상 구체적 문장으로 제시해 정답이 하나로 결정되게 할 것
- **정답이 완전한 문장이면 지시문에 출력 형식을 반드시 명시할 것.** 특히 [서술형-오류 수정]은 "고쳐 쓰시오"로 끝내지 말고 "전체 문장을 바르게 고쳐 쓰시오" 또는 " ※ 완전한 문장으로 쓰시오."를 넣어, 학생이 일부만 써서 오답 처리되지 않게 할 것
- **[서술형-오류 수정]의 answer는 "고친 형태"만(고친 단어/구 또는 전체 고친 문장).** "틀린단어 / 고친단어" 쌍(예: "be / is", "that / who")으로 만들지 말 것 — 슬래시가 빈칸 분할로 오인되고 학생이 형식을 몰라 오답남. question 끝에 " ※ 고친 부분만 쓰시오." 안내, 정답 후보 여럿이면 acceptedAnswers로`;

  return `아래는 중학교 영어 시험에서 추출한 원본 문제들입니다:

${JSON.stringify(originalQuestions, null, 2)}

위 원본 문제들을 참고하여, 아래 분배표에 맞게 문제를 새로 만드세요.
문법 주제: ${unitTitle || '중학 영어 문법'}

${distribution}

각 문제 형식 (JSON 배열로만 응답):
[
  {
    "number": 1,
    "question": "문제 텍스트",
    "options": ${questionType === 'mcq' ? '["① 보기1", "② 보기2", "③ 보기3", "④ 보기4", "⑤ 보기5"]' : 'null'},
    "answer": "정답",
    "explanation": "해설"
  }
]

규칙:
${typeRules}
- 원본 문제를 그대로 복사하지 말고, 같은 문법 포인트를 다른 문장/상황으로 패러프레이징
- 중학생 수준에 적합한 난이도
- number는 분배표의 번호 범위에 맞춰서 순서대로`;
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

  const limited = await checkRateLimit(user.id, 'naesin/problems/extract-paraphrase', 30);
  if (limited) return limited;

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
    const extractMessage = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
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
    "options": ["① 보기1", "② 보기2", "③ 보기3", "④ 보기4", "⑤ 보기5"],
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
- 객관식: options 배열에 보기, answer에 정답 번호 또는 텍스트
- 서술형: options는 null, answer에 정답 텍스트
- 모든 문제를 빠짐없이 추출`,
            },
          ],
        },
      ],
    });

    const originalQuestions = requireAiJsonArray(extractMessage, 'ai.extract');
    logger.info('ai.extract_done', { count: originalQuestions.length, unitId });

    // Step 2: Paraphrase — 객관식 32문제 + 서술형 18문제 동시 생성
    const [mcqMessage, subjectiveMessage] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 16384,
        messages: [
          { role: 'user', content: buildParaphrasePrompt(originalQuestions, unitTitle, MCQ_DISTRIBUTION, 'mcq') },
        ],
      }),
      anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 8192,
        messages: [
          { role: 'user', content: buildParaphrasePrompt(originalQuestions, unitTitle, SUBJECTIVE_DISTRIBUTION, 'subjective') },
        ],
      }),
    ]);

    const mcqQuestions = requireAiJsonArray<Record<string, unknown>>(mcqMessage, 'ai.paraphrase_mcq');
    const subjectiveQuestions = requireAiJsonArray<Record<string, unknown>>(subjectiveMessage, 'ai.paraphrase_subjective');

    // Renumber: MCQ 1~32, Subjective 33~50
    const questions = [
      ...mcqQuestions.map((q, i) => ({ ...q, number: i + 1 })),
      ...subjectiveQuestions.map((q, i) => ({ ...q, number: mcqQuestions.length + i + 1 })),
    ];

    logger.info('ai.paraphrase_done', { mcq: mcqQuestions.length, subjective: subjectiveQuestions.length, total: questions.length, unitId });

    // Layer 1: Structural validation (free, instant)
    const structural = validateProblemStructure(questions as NaesinProblemQuestion[], mcqQuestions.length, subjectiveQuestions.length);

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
