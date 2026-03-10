import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { grammarChatQuestionCreateSchema, idSchema } from '@/lib/api/schemas';

// GET: List questions for a lesson
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lessonId');

  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId가 필요합니다.' }, { status: 400 });
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('naesin_grammar_chat_questions')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sort_order');

  if (error) {
    return NextResponse.json({ error: '질문 목록을 불러오지 못했습니다.' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: Create a new question
export const POST = createApiHandler(
  { schema: grammarChatQuestionCreateSchema, roles: ['teacher', 'admin', 'boss'] },
  async ({ body, supabase }) => {
    const { lessonId, questionText, grammarConcept, hint, expectedAnswerKeywords, sortOrder } = body;

    const { data, error } = await supabase
      .from('naesin_grammar_chat_questions')
      .insert({
        lesson_id: lessonId,
        question_text: questionText,
        grammar_concept: grammarConcept || null,
        hint: hint || null,
        expected_answer_keywords: expectedAnswerKeywords || [],
        sort_order: sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '질문 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(data);
  }
);

// PATCH: Update a question
export const PATCH = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'] },
  async ({ body, supabase }) => {
    const parsed = idSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
    }

    const { id, ...updates } = body as Record<string, unknown>;

    const updateData: Record<string, unknown> = {};
    if (updates.questionText !== undefined) updateData.question_text = updates.questionText;
    if (updates.grammarConcept !== undefined) updateData.grammar_concept = updates.grammarConcept || null;
    if (updates.hint !== undefined) updateData.hint = updates.hint || null;
    if (updates.expectedAnswerKeywords !== undefined) updateData.expected_answer_keywords = updates.expectedAnswerKeywords;
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;

    const { data, error } = await supabase
      .from('naesin_grammar_chat_questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '질문 수정에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(data);
  }
);

// DELETE: Delete a question
export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: true },
  async ({ body, supabase }) => {
    const parsed = idSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
    }

    const { id } = parsed.data;

    const { error } = await supabase
      .from('naesin_grammar_chat_questions')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: '질문 삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }
);
