import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import { engEngDefGenerateSchema } from '@/lib/api/schemas';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 120;

const anthropic = new Anthropic();

function buildEngEngDefPrompt(
  words: { english: string; korean: string }[],
  mcqCount: number,
  writingCount: number,
  contextCount: number,
): string {
  const wordList = words.map((w) => `- ${w.english}: ${w.korean}`).join('\n');
  const total = mcqCount + writingCount + contextCount;

  return `당신은 중학교 영어 어휘 시험 출제 전문가입니다.

## 과제
아래 단어 목록으로 영영 풀이 문제를 총 ${total}개 생성하세요.

## 단어 목록
${wordList}

## 문제 유형 배분
1. **객관식 (MCQ)**: ${mcqCount}개
   - "Which word matches the following definition?" 형태
   - 영영 뜻을 제시하고 4~5개 보기에서 정답 단어 선택
   - 보기는 같은 단어 목록에서 선택 (모두 그럴듯한 오답)
   - question: 영영 뜻을 포함한 질문 (한국어로 지시문, 영영 뜻은 영어)
   - options: 4~5개 영어 단어
   - answer: 정답 번호 (문자열 "1"~"5")

2. **서술형 (Writing)**: ${writingCount}개
   - "다음 영영 뜻에 해당하는 단어를 쓰시오." 형태
   - question: 영영 뜻을 제시
   - options: null
   - answer: 정답 단어 (소문자)
   - acceptedAnswers: 대소문자 변형 등

3. **문맥 빈칸 (Context)**: ${contextCount}개
   - 문장에서 단어를 빈칸으로 처리하고 괄호 안에 영영 뜻 제시
   - question: "다음 빈칸에 알맞은 단어를 쓰시오.\\nThe ___ was very impressive. (= the act of performing)"
   - options: null
   - answer: 정답 단어
   - acceptedAnswers: 대소문자/복수형 변형

## 핵심 규칙
1. 영영 뜻은 중학생이 이해할 수 있는 쉬운 영어로 작성
2. 객관식 정답을 1~5에 균등 배분
3. 해설은 한국어로 간결하게 (영영 뜻 해석 + 정답 설명)
4. 모든 문장은 중학교 수준 어휘 사용

## 출력 형식
JSON 배열로만 응답하세요.

[
  {
    "number": 1,
    "question": "다음 영영 뜻에 해당하는 단어로 알맞은 것은?\\n\\"to make something better\\"",
    "options": ["improve", "remove", "approve", "provide", "involve"],
    "answer": "1",
    "explanation": "improve: 더 좋게 만들다. 영영 뜻 'to make something better'에 해당합니다."
  },
  {
    "number": 2,
    "question": "다음 영영 뜻에 해당하는 단어를 쓰시오.\\n\\"a person who teaches\\"",
    "options": null,
    "answer": "teacher",
    "explanation": "'가르치는 사람'이라는 뜻으로 teacher가 정답입니다.",
    "acceptedAnswers": ["Teacher"]
  }
]`;
}

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: engEngDefGenerateSchema, rateLimit: { max: 30 } },
  async ({ user, body, supabase }) => {
    await requireContentPermission(user, supabase);
    const { title, words, mcqCount, writingCount, contextCount } = body;

    const totalCount = mcqCount + writingCount + contextCount;
    if (totalCount === 0) {
      return NextResponse.json({ error: '문제 수를 1개 이상 설정하세요.' }, { status: 400 });
    }

    try {
      const msg = await anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 8192,
        messages: [{
          role: 'user',
          content: buildEngEngDefPrompt(words, mcqCount, writingCount, contextCount),
        }],
      });

      const questions = requireAiJsonArray<NaesinProblemQuestion>(msg, 'ai.generate_eng_eng_def');
      const numbered = questions.map((q, i) => ({ ...q, number: i + 1 }));

      logger.info('ai.generate_eng_eng_def', {
        userId: user.id,
        wordCount: words.length,
        totalGenerated: numbered.length,
      });

      return NextResponse.json({ questions: numbered, title });
    } catch (error) {
      logger.error('ai.generate_eng_eng_def', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'AI 영영풀이 생성 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }
  },
);
