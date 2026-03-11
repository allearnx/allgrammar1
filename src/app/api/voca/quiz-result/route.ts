import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { quizResultCreateSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: quizResultCreateSchema },
  async ({ user, body, supabase }) => {
    const { unitId, score, totalQuestions, correctCount, wrongWords } = body;

    // Get current max attempt_number
    const { data: latest } = await supabase
      .from('voca_quiz_results')
      .select('attempt_number')
      .eq('student_id', user.id)
      .eq('day_id', unitId)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .single();

    const attemptNumber = (latest?.attempt_number ?? 0) + 1;

    const data = dbResult(await supabase
      .from('voca_quiz_results')
      .insert({
        student_id: user.id,
        day_id: unitId,
        attempt_number: attemptNumber,
        score,
        total_questions: totalQuestions,
        correct_count: correctCount,
        wrong_words: wrongWords || [],
      })
      .select()
      .single());
    return NextResponse.json({ result: data });
  }
);
