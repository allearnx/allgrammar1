import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { grammarChatStartSchema } from '@/lib/api/schemas';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAiJsonArray } from '@/lib/ai-json';
import type { NaesinGrammarChatMessage } from '@/types/database';

export const maxDuration = 60;

const anthropic = new Anthropic();

interface GeneratedQuestion {
  question_text: string;
  grammar_concept: string;
  hint: string;
  expected_answer_keywords: string[];
}

export const POST = createApiHandler(
  { schema: grammarChatStartSchema },
  async ({ user, body, supabase }) => {
    const { lessonId } = body;

    // Close any existing incomplete sessions for this lesson
    await supabase
      .from('naesin_grammar_chat_sessions')
      .update({ is_complete: true, updated_at: new Date().toISOString() })
      .eq('student_id', user.id)
      .eq('lesson_id', lessonId)
      .eq('is_complete', false);

    // Get questions for this lesson
    let { data: questions } = await supabase
      .from('naesin_grammar_chat_questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('sort_order');

    // If no questions exist, auto-generate with AI
    if (!questions || questions.length === 0) {
      try {
        // Fetch lesson info for context
        const { data: lesson } = await supabase
          .from('naesin_grammar_lessons')
          .select('title, text_content')
          .eq('id', lessonId)
          .single();

        if (!lesson) {
          return NextResponse.json(
            { error: '레슨을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        const prompt = `당신은 한국 중학생을 가르치는 영어 문법 선생님입니다.
레슨 제목: "${lesson.title}"
${lesson.text_content ? `레슨 내용:\n${lesson.text_content}` : ''}

이 레슨의 핵심 문법 개념을 확인하는 쉬운 질문 5개를 만들어주세요.

질문 작성 가이드:
- 문법 개념의 정의나 뜻을 물어보세요 (예: "현재완료란 무엇인가요?", "to부정사는 어떤 역할을 하나요?")
- 간단한 O/X 판단이나 빈칸 채우기 형태도 좋습니다
- 중학생이 부담 없이 답할 수 있는 난이도로 만들어주세요
- 한국어로 질문하되, 예시 문장은 영어로 포함하세요
- 1번이 가장 쉽고, 5번이 조금 더 생각이 필요한 수준

다음 JSON 배열로만 응답하세요:
[
  {
    "question_text": "질문 내용",
    "grammar_concept": "문법 개념명",
    "hint": "힌트 (1문장)",
    "expected_answer_keywords": ["핵심 키워드1", "핵심 키워드2"]
  }
]`;

        const aiResponse = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        const generated = requireAiJsonArray<GeneratedQuestion>(aiResponse, 'ai.chat_questions_generate');

        // Insert generated questions using admin client (bypasses RLS)
        const adminClient = createAdminClient();
        const rows = generated.map((q, i) => ({
          lesson_id: lessonId,
          question_text: q.question_text,
          grammar_concept: q.grammar_concept || null,
          hint: q.hint || null,
          expected_answer_keywords: q.expected_answer_keywords || [],
          sort_order: i,
          is_auto_generated: true,
        }));

        const { error: insertError } = await adminClient
          .from('naesin_grammar_chat_questions')
          .insert(rows);

        if (insertError) {
          logger.error('ai.chat_questions_insert', { error: insertError.message });
          return NextResponse.json(
            { error: 'AI 질문 저장에 실패했습니다.' },
            { status: 500 }
          );
        }

        // Re-fetch the inserted questions
        const { data: newQuestions } = await supabase
          .from('naesin_grammar_chat_questions')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('sort_order');

        questions = newQuestions;
      } catch (error) {
        logger.error('ai.chat_questions_generate', { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
          { error: 'AI 질문 생성 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: '질문을 생성할 수 없습니다.' },
        { status: 500 }
      );
    }

    const firstQuestion = questions[0];

    const aiMessage: NaesinGrammarChatMessage = {
      role: 'ai',
      content: firstQuestion.question_text,
      questionId: firstQuestion.id,
      timestamp: new Date().toISOString(),
    };

    const { data: session, error } = await supabase
      .from('naesin_grammar_chat_sessions')
      .insert({
        student_id: user.id,
        lesson_id: lessonId,
        messages: [aiMessage],
        turn_count: 0,
        current_question_id: firstQuestion.id,
        questions_used: [firstQuestion.id],
      })
      .select()
      .single();

    if (error) {
      logger.error('chat.session_create', { error: error.message, lessonId });
      return NextResponse.json(
        { error: `세션 생성 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(session);
  }
);
