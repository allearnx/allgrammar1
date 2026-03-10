import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import { grammarChatReplySchema } from '@/lib/api/schemas';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import type { NaesinGrammarChatMessage } from '@/types/database';

const anthropic = new Anthropic();

export const POST = createApiHandler(
  { schema: grammarChatReplySchema },
  async ({ user, body, supabase }) => {
    const { sessionId, message } = body;

    const limited = checkRateLimit(user.id, 'grammar/chat/reply', 30);
    if (limited) return limited;

    // Get session
    const { data: session } = await supabase
      .from('naesin_grammar_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('student_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (session.is_complete) {
      return NextResponse.json({ error: '이미 완료된 대화입니다.' }, { status: 400 });
    }

    // Get current question details
    const { data: currentQuestion } = await supabase
      .from('naesin_grammar_chat_questions')
      .select('*')
      .eq('id', session.current_question_id)
      .single();

    // Get lesson title for context
    const { data: lesson } = await supabase
      .from('naesin_grammar_lessons')
      .select('title')
      .eq('id', session.lesson_id)
      .single();

    const newTurnCount = session.turn_count + 1;
    const isLastTurn = newTurnCount >= session.max_turns;

    // Get all questions to find the next one
    const { data: allQuestions } = await supabase
      .from('naesin_grammar_chat_questions')
      .select('*')
      .eq('lesson_id', session.lesson_id)
      .order('sort_order');

    const usedIds = new Set(session.questions_used as string[]);
    const nextQuestion = allQuestions?.find((q: { id: string }) => !usedIds.has(q.id));

    try {
      const aiResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `당신은 소크라테스식 영어 문법 튜터입니다. 한국 중학생을 대상으로 한국어로 대화합니다.

레슨: "${lesson?.title || ''}"
${currentQuestion?.grammar_concept ? `문법 개념: ${currentQuestion.grammar_concept}` : ''}
질문: "${currentQuestion?.question_text || ''}"
${currentQuestion?.hint ? `힌트: ${currentQuestion.hint}` : ''}
${currentQuestion?.expected_answer_keywords?.length ? `핵심 키워드: ${currentQuestion.expected_answer_keywords.join(', ')}` : ''}

학생의 답변: "${message}"

${isLastTurn ? '이것이 마지막 턴입니다. 전체 대화를 종합하는 피드백을 주세요.' : ''}

다음 JSON 형식으로만 응답하세요:
{
  "feedback": "<학생 답변에 대한 피드백 2~3문장, 한국어>",
  "isCorrect": <true/false>,
  "correctedPoint": "<틀린 부분 교정 또는 null>"
}

피드백 가이드:
- 격려하면서 정확한 교정을 해주세요
- 문법 용어를 쉽게 설명해주세요
${isLastTurn ? '- 마지막 턴이므로 전체 학습을 정리해주세요' : '- 다음 질문으로 자연스럽게 이어질 수 있게 마무리해주세요'}`,
          },
        ],
      });

      const responseText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid AI response format');

      const result = JSON.parse(jsonMatch[0]);

      // Build messages
      const messages = session.messages as NaesinGrammarChatMessage[];

      const studentMsg: NaesinGrammarChatMessage = {
        role: 'student',
        content: message,
        timestamp: new Date().toISOString(),
      };

      const aiMsg: NaesinGrammarChatMessage = {
        role: 'ai',
        content: result.feedback,
        feedback: {
          isCorrect: result.isCorrect,
          correctedPoint: result.correctedPoint || null,
        },
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, studentMsg, aiMsg];

      // Add next question if not last turn and there's a next question
      let newCurrentQuestionId = session.current_question_id;
      const newQuestionsUsed = [...(session.questions_used as string[])];

      if (!isLastTurn && nextQuestion) {
        const nextQuestionMsg: NaesinGrammarChatMessage = {
          role: 'ai',
          content: nextQuestion.question_text,
          questionId: nextQuestion.id,
          timestamp: new Date().toISOString(),
        };
        updatedMessages.push(nextQuestionMsg);
        newCurrentQuestionId = nextQuestion.id;
        newQuestionsUsed.push(nextQuestion.id);
      } else if (!isLastTurn && !nextQuestion) {
        // No more questions — complete the session
      }

      const isComplete = isLastTurn || (!nextQuestion && !isLastTurn);

      if (isComplete) {
        const completeMsg: NaesinGrammarChatMessage = {
          role: 'ai',
          content: isLastTurn
            ? '수고했어요! 오늘 문법 대화를 마무리합니다. 다시 도전하고 싶으면 "다시 시작" 버튼을 눌러주세요!'
            : '준비된 질문을 모두 완료했어요! 잘 했습니다. 다시 도전하고 싶으면 "다시 시작" 버튼을 눌러주세요!',
          timestamp: new Date().toISOString(),
        };
        updatedMessages.push(completeMsg);
      }

      // Update session
      const { data: updated, error: updateError } = await supabase
        .from('naesin_grammar_chat_sessions')
        .update({
          messages: updatedMessages,
          turn_count: newTurnCount,
          is_complete: isComplete,
          current_question_id: isComplete ? null : newCurrentQuestionId,
          questions_used: newQuestionsUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: '세션 업데이트에 실패했습니다.' }, { status: 500 });
      }

      return NextResponse.json(updated);
    } catch (error) {
      logger.error('ai.chat', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: 'AI 응답 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
);
