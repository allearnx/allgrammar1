import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { logger } from '@/lib/logger';
import { similarProblemGenerateSchema } from '@/lib/api/schemas';
import Anthropic from '@anthropic-ai/sdk';
import { parseAiJsonArray } from '@/lib/ai-json';
import { runFullValidation } from '@/lib/validation';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 60;

const anthropic = new Anthropic();

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: similarProblemGenerateSchema, rateLimit: { max: 50 } },
  async ({ user, body, supabase }) => {
    const { unitId, wrongAnswerIds, grammarTag } = body;

    // Fetch wrong answers for context
    let wrongAnswers: unknown[] = [];
    if (wrongAnswerIds?.length) {
      const { data } = await supabase
        .from('naesin_wrong_answers')
        .select('*')
        .in('id', wrongAnswerIds);
      wrongAnswers = data || [];
    } else {
      const { data } = await supabase
        .from('naesin_wrong_answers')
        .select('*')
        .eq('unit_id', unitId)
        .eq('resolved', false)
        .limit(10);
      wrongAnswers = data || [];
    }

    if (wrongAnswers.length === 0) {
      return NextResponse.json({ error: '오답 데이터가 없습니다.' }, { status: 400 });
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `중학교 영어 내신 시험을 위한 유사 문제를 생성해주세요.

학생이 틀린 문제 데이터:
${JSON.stringify(wrongAnswers, null, 2)}

${grammarTag ? `문법 태그: ${grammarTag}` : ''}

규칙:
- 틀린 유형과 유사하되 다른 문제를 3~5개 생성
- 객관식은 5지선다
- 난이도는 원래 문제와 비슷하게
- 중학생 수준에 맞게

JSON 배열로만 응답:
[
  {
    "number": 1,
    "question": "문제 내용",
    "options": ["1번 보기", "2번 보기", "3번 보기", "4번 보기", "5번 보기"],
    "answer": "3",
    "explanation": "해설"
  }
]`,
          },
        ],
      });

      const questions = parseAiJsonArray(message);
      if (questions.length === 0) {
        throw new Error('AI 응답 파싱 실패');
      }

      // Run full validation (Layer 1+2+3)
      const validation = await runFullValidation(
        questions as NaesinProblemQuestion[],
        anthropic,
      );

      const qualityScores = validation.qualityScore?.scores || [];

      const rows = questions.map((q: unknown) => {
        const qData = q as NaesinProblemQuestion;
        const qs = qualityScores.find((s) => s.questionNumber === qData.number);
        return {
          unit_id: unitId,
          wrong_answer_id: wrongAnswerIds?.[0] || null,
          grammar_tag: grammarTag || null,
          question_data: q,
          status: 'pending',
          created_by: user.id,
          quality_score: qs?.overall ?? null,
          validation_result: validation,
        };
      });

      const inserted = dbResult(await supabase
        .from('naesin_similar_problems')
        .insert(rows)
        .select());

      return NextResponse.json({ problems: inserted, validation });
    } catch (error) {
      logger.error('ai.generate', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: error instanceof Error ? error.message : '생성 중 오류' },
        { status: 500 }
      );
    }
  }
);
