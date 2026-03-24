import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';

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
- 유형 표시: [빈칸 채우기], [영작 선택], [용법 구별], [어법 판단]`
    : `- options는 null, answer에 정답 텍스트
- 유형 표시: [서술형-영작], [서술형-어순 배열], [서술형-오류 수정]`;

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

  const limited = await checkRateLimit(user.id, 'naesin/problems/extract-paraphrase', 5);
  if (limited) return limited;

  try {
    const { unitId, unitTitle, pdfBase64, mediaType } = await request.json();

    if (!unitId || !pdfBase64 || !mediaType) {
      return NextResponse.json({ error: 'unitId, pdfBase64, mediaType는 필수입니다.' }, { status: 400 });
    }

    // Step 1: Extract problems from PDF
    const extractMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16384,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: mediaType, data: pdfBase64 },
            },
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
        model: 'claude-sonnet-4-6',
        max_tokens: 16384,
        messages: [
          { role: 'user', content: buildParaphrasePrompt(originalQuestions, unitTitle, MCQ_DISTRIBUTION, 'mcq') },
        ],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-6',
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

    return NextResponse.json({ questions, originalCount: originalQuestions.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('ai.extract_paraphrase', { error: msg });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF 패러프레이징 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
