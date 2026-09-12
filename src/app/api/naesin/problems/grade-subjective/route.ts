import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { gradeSubjectiveSchema } from '@/lib/api/schemas';
import { gradeItems } from '@/lib/grading/engine';
import { naesinAnswerKeyAdapter } from '@/lib/grading/adapters/naesin-answer-key';
import { createAnthropicLlm } from '@/lib/grading/llm/anthropic';
import { logger } from '@/lib/logger';

export const maxDuration = 30;

/**
 * 내신 서술형 라이브 채점.
 * 문자열 일치(정규화·구분자·부분 일치)는 엔진의 빠른 경로가 즉시 정답 처리하고,
 * 불일치 시 AI가 정답키 기준으로 100/50/0 + 피드백을 판정한다.
 * AI 판정 건은 subjective_grading_logs에 기록해 선생님이 검수·교정한다.
 */
export const POST = createApiHandler(
  { schema: gradeSubjectiveSchema, rateLimit: { max: 200 } },
  async ({ user, body, supabase }) => {
    const { question, referenceAnswer, studentAnswer, acceptedAnswers, sheetId, questionNumber } = body;

    const [result] = await gradeItems(
      [{
        id: 'q',
        prompt: question,
        referenceAnswer,
        studentAnswer,
        acceptedAnswers,
      }],
      naesinAnswerKeyAdapter,
      createAnthropicLlm(),
    );

    // AI 판정 건만 검수 로그로 남긴다 (문자열 일치는 검수 가치 없음).
    // 로그 실패가 채점 응답을 막으면 안 되므로 결과 반환과 분리해 흡수한다.
    if (result.method !== 'exact') {
      const { error } = await supabase.from('subjective_grading_logs').insert({
        user_id: user.id,
        sheet_id: sheetId ?? null,
        question_number: questionNumber ?? null,
        question,
        reference_answer: referenceAnswer,
        student_answer: studentAnswer,
        ai_score: result.score,
        ai_feedback: result.feedback ?? null,
        corrected_answer: result.correctedAnswer ?? null,
        grading_method: result.method,
      });
      if (error) {
        logger.error('naesin.grading_log', { error: error.message, userId: user.id });
      }
    }

    return NextResponse.json({
      score: result.score,
      ...(result.feedback ? { feedback: result.feedback } : {}),
      ...(result.correctedAnswer ? { correctedAnswer: result.correctedAnswer } : {}),
    });
  }
);
