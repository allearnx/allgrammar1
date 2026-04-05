import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import { aiProblemGenerateSchema } from '@/lib/api/schemas';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';
import { validateProblemStructure } from '@/lib/validation';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 120;

const anthropic = new Anthropic();

const VOCAB_LEVEL: Record<string, string> = {
  '1': '중1 수준 (8-12단어, 간단한 문장)',
  '2': '중2 수준 (10-15단어, 복합 문장 가능)',
  '3': '중3 수준 (12-20단어, 복잡한 구조 허용)',
};

function buildMcqPrompt(
  grammarTopic: string,
  focusPoints: string | null,
  grade: string,
  count: number,
  trapPercent: string,
): string {
  const trapCount = Math.max(1, Math.round(count * parseInt(trapPercent) / 100));
  const normalCount = count - trapCount;

  return `당신은 중학교 영어 내신 시험 출제 전문가입니다.

## 과제
"${grammarTopic}" 문법 주제로 객관식 5지선다 문제를 ${count}개 생성하세요.

## 학년별 어휘
${VOCAB_LEVEL[grade]}

${focusPoints ? `## 출제 포인트\n${focusPoints}\n` : ''}
## 핵심 규칙

### 1. 매력적 오답 (CRITICAL)
모든 오답은 문법적으로 그럴듯해야 합니다. 형태만 다른 오답은 절대 금지합니다.

BAD (형태로 바로 답 보임):
- ① to play ② plays ③ played ④ playing ⑤ play
→ 길이/형태가 달라서 패턴으로 맞출 수 있음

GOOD (문법 이해 필요):
- 빈칸: He decided ___ the guitar after school.
- ① to play ② to playing ③ for play ④ to played ⑤ for playing
→ 모두 전치사/to 구조로 그럴듯함

### 2. 함정 문제 (${trapCount}개 / ${count}개)
- 일반 문제: ${normalCount}개 — "${grammarTopic}"이 정답인 문제
- 함정 문제: ${trapCount}개 — "${grammarTopic}"이 정답이 아닌 문제 (다른 문법이 정답)
- 함정 문제 해설에 반드시 "[함정]" 표시

### 3. 정답 분포
정답을 ①~⑤ (숫자 1~5) 에 균등하게 분배하세요. 각 번호가 비슷한 횟수로 등장해야 합니다.

### 4. 해설
각 문제의 정답 이유와 오답 이유를 간결하게 한국어로 작성하세요.

## 출력 형식
JSON 배열로만 응답하세요. 다른 텍스트는 포함하지 마세요.

[
  {
    "number": 1,
    "question": "다음 빈칸에 들어갈 말로 알맞은 것은?\\nHe decided ___ the guitar after school.",
    "options": ["to play", "to playing", "for play", "to played", "for playing"],
    "answer": "1",
    "explanation": "decide는 to부정사를 목적어로 취하는 동사이므로 to play가 정답. to playing/for playing은 전치사+동명사 형태로 decide와 어울리지 않음."
  }
]`;
}

function buildSelectAllPrompt(
  grammarTopic: string,
  focusPoints: string | null,
  grade: string,
  count: number,
): string {
  return `당신은 중학교 영어 내신 시험 출제 전문가입니다.

## 과제
"${grammarTopic}" 문법 주제로 "모두 고르시오" 유형 문제를 ${count}개 생성하세요.

## 학년별 어휘
${VOCAB_LEVEL[grade]}

${focusPoints ? `## 출제 포인트\n${focusPoints}\n` : ''}
## "모두 고르시오" 형식
- question 필드에 ⓐ~ⓗ (6~8개) 문장을 나열합니다.
- options 필드에 정답 조합 5개를 넣습니다.
- answer는 정답 조합의 번호(1~5)입니다.

예시:
{
  "number": 1,
  "question": "다음 중 밑줄 친 to부정사의 용법이 명사적 용법인 것을 모두 고르시오.\\nⓐ I want to be a doctor.\\nⓑ She went to the store to buy milk.\\nⓒ To study hard is important.\\nⓓ He has something to eat.\\nⓔ My dream is to travel the world.\\nⓕ I was happy to see you.",
  "options": ["ⓐ, ⓒ, ⓔ", "ⓐ, ⓑ, ⓒ", "ⓑ, ⓓ, ⓕ", "ⓐ, ⓒ, ⓓ, ⓔ", "ⓐ, ⓑ, ⓔ, ⓕ"],
  "answer": "1",
  "explanation": "ⓐ want의 목적어(명사적), ⓒ 주어(명사적), ⓔ 보어(명사적). ⓑ 목적의 부사적, ⓓ 형용사적, ⓕ 감정원인의 부사적 용법."
}

## 핵심 규칙
1. ⓐ~ⓗ 문장은 문법적으로 모두 정확해야 합니다.
2. 각 조합 보기가 그럴듯하게 보여야 합니다 (오답 조합에도 정답 일부 포함).
3. 정답 번호를 1~5에 균등 배분하세요.
4. 해설에서 각 문장의 용법/구분을 설명하세요.

## 출력 형식
JSON 배열로만 응답하세요.

[
  {
    "number": 1,
    "question": "문제 지문 (ⓐ~ⓗ 포함)",
    "options": ["조합1", "조합2", "조합3", "조합4", "조합5"],
    "answer": "1",
    "explanation": "해설"
  }
]`;
}

function buildSubjectivePrompt(
  grammarTopic: string,
  focusPoints: string | null,
  grade: string,
  count: number,
): string {
  return `당신은 중학교 영어 내신 시험 출제 전문가입니다.

## 과제
"${grammarTopic}" 문법 주제로 서술형 문제를 ${count}개 생성하세요.

## 학년별 어휘
${VOCAB_LEVEL[grade]}

${focusPoints ? `## 출제 포인트\n${focusPoints}\n` : ''}
## 서술형 유형
- 영작, 어순 배열, 오류 수정, 조건 영작 등 다양하게 출제하세요.

## 핵심 규칙
1. 명확한 정답이 있어야 합니다.
2. 조건이 구체적이어야 합니다 (예: "주어진 단어를 모두 사용하여").
3. 해설에 채점 기준을 포함하세요.

## 출력 형식
JSON 배열로만 응답하세요. 서술형은 options를 null로 설정합니다.

[
  {
    "number": 1,
    "question": "다음 우리말에 맞게 주어진 단어를 배열하여 영작하시오.\\n'나는 영어를 공부하기로 결심했다.'\\n(decided / I / English / study / to)",
    "options": null,
    "answer": "I decided to study English",
    "explanation": "decide + to부정사 구문. 어순: 주어(I) + 동사(decided) + to부정사(to study) + 목적어(English)"
  }
]`;
}

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: aiProblemGenerateSchema, rateLimit: { max: 30 } },
  async ({ user, body }) => {
    const { unitId, title, grammarTopic, focusPoints, grade, mcqCount, selectAllCount, subjectiveCount, trapPercent } = body;

    const totalCount = mcqCount + selectAllCount + subjectiveCount;
    if (totalCount === 0) {
      return NextResponse.json({ error: '문제 수를 1개 이상 설정하세요.' }, { status: 400 });
    }

    try {
      // Build prompts and call AI in parallel
      const calls: Promise<NaesinProblemQuestion[]>[] = [];

      if (mcqCount > 0) {
        calls.push(
          anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 8192,
            messages: [{ role: 'user', content: buildMcqPrompt(grammarTopic, focusPoints ?? null, grade, mcqCount, trapPercent) }],
          }).then((msg) => requireAiJsonArray<NaesinProblemQuestion>(msg, 'ai.generate_mcq'))
        );
      } else {
        calls.push(Promise.resolve([]));
      }

      if (selectAllCount > 0) {
        calls.push(
          anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 8192,
            messages: [{ role: 'user', content: buildSelectAllPrompt(grammarTopic, focusPoints ?? null, grade, selectAllCount) }],
          }).then((msg) => requireAiJsonArray<NaesinProblemQuestion>(msg, 'ai.generate_select_all'))
        );
      } else {
        calls.push(Promise.resolve([]));
      }

      if (subjectiveCount > 0) {
        calls.push(
          anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            messages: [{ role: 'user', content: buildSubjectivePrompt(grammarTopic, focusPoints ?? null, grade, subjectiveCount) }],
          }).then((msg) => requireAiJsonArray<NaesinProblemQuestion>(msg, 'ai.generate_subjective'))
        );
      } else {
        calls.push(Promise.resolve([]));
      }

      const [mcqQuestions, selectAllQuestions, subjectiveQuestions] = await Promise.all(calls);

      // Merge and renumber
      const allQuestions: NaesinProblemQuestion[] = [
        ...mcqQuestions,
        ...selectAllQuestions,
        ...subjectiveQuestions,
      ].map((q, i) => ({ ...q, number: i + 1 }));

      if (allQuestions.length === 0) {
        throw new Error('AI 문제 생성 결과가 비어있습니다.');
      }

      // Layer 1 structural validation
      const structural = validateProblemStructure(allQuestions);

      logger.info('ai.generate_problems', {
        userId: user.id,
        unitId,
        grammarTopic,
        totalGenerated: allQuestions.length,
        structuralValid: structural.valid,
      });

      return NextResponse.json({
        questions: allQuestions,
        title,
        validation: {
          structural,
          badge: structural.valid ? 'pass' : 'fail',
          summary: structural.valid
            ? `구조 검증 통과 (${allQuestions.length}문제)`
            : `구조 오류 ${structural.errorCount}건`,
        },
      });
    } catch (error) {
      logger.error('ai.generate_problems', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'AI 문제 생성 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }
  },
);
