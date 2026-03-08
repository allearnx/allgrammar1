import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { grammarChatStartSchema } from '@/lib/api/schemas';
import type { NaesinGrammarChatMessage } from '@/types/database';

export const POST = createApiHandler(
  { schema: grammarChatStartSchema },
  async ({ user, body, supabase }) => {
    const { lessonId } = body;

    // Check for existing incomplete session
    const { data: existing } = await supabase
      .from('naesin_grammar_chat_sessions')
      .select('*')
      .eq('student_id', user.id)
      .eq('lesson_id', lessonId)
      .eq('is_complete', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(existing);
    }

    // Get questions for this lesson
    const { data: questions } = await supabase
      .from('naesin_grammar_chat_questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('sort_order');

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: '이 레슨에 등록된 AI 질문이 없습니다.' },
        { status: 404 }
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
      return NextResponse.json(
        { error: '세션 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(session);
  }
);
