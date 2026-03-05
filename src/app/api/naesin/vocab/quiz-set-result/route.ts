import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { quizSetResultSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: quizSetResultSchema },
  async ({ user, body, supabase }) => {
    const { quizSetId, unitId, score, wrongWords } = body;

    // Save result
    const { data: result, error } = await supabase
      .from('naesin_vocab_quiz_set_results')
      .insert({
        student_id: user.id,
        quiz_set_id: quizSetId,
        score,
        wrong_words: wrongWords || [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Check if this set is now completed (80%+) and update progress
    if (score >= 80 && unitId) {
      const { count: totalSets } = await supabase
        .from('naesin_vocab_quiz_sets')
        .select('*', { count: 'exact', head: true })
        .eq('unit_id', unitId);

      const { data: allSets } = await supabase
        .from('naesin_vocab_quiz_sets')
        .select('id')
        .eq('unit_id', unitId);

      let completedCount = 0;
      if (allSets) {
        for (const set of allSets) {
          const { data: bestResult } = await supabase
            .from('naesin_vocab_quiz_set_results')
            .select('score')
            .eq('student_id', user.id)
            .eq('quiz_set_id', set.id)
            .order('score', { ascending: false })
            .limit(1)
            .single();
          if (bestResult && bestResult.score >= 80) {
            completedCount++;
          }
        }
      }

      await supabase
        .from('naesin_student_progress')
        .upsert(
          {
            student_id: user.id,
            unit_id: unitId,
            vocab_quiz_sets_completed: completedCount,
            vocab_total_quiz_sets: totalSets || 0,
          },
          { onConflict: 'student_id,unit_id' }
        );
    }

    return NextResponse.json({ result });
  }
);
