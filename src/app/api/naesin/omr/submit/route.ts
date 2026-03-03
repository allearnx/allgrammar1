import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { unitId, omrSheetId, studentAnswers, correctCount, totalQuestions, scorePercent } = await request.json();
  if (!unitId || !omrSheetId || !studentAnswers) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Save OMR attempt
  const { error: attemptError } = await supabase
    .from('naesin_omr_attempts')
    .insert({
      student_id: user.id,
      omr_sheet_id: omrSheetId,
      student_answers: studentAnswers,
      correct_count: correctCount,
      total_questions: totalQuestions,
      score_percent: scorePercent,
    });

  if (attemptError) return NextResponse.json({ error: attemptError.message }, { status: 500 });

  // Mark OMR stage as completed (1+ attempts)
  const { error: progressError } = await supabase
    .from('naesin_student_progress')
    .upsert(
      {
        student_id: user.id,
        unit_id: unitId,
        omr_completed: true,
      },
      { onConflict: 'student_id,unit_id' }
    );

  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 });
  return NextResponse.json({ success: true, omrCompleted: true });
}
