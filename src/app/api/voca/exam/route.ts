import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaExamSaveSchema } from '@/lib/api/schemas';

// POST — 묶음 보너스 시험(Day 1~3개) 결과 저장
// Day 조합(range_key)별로 매 응시 기록. 최고점/재응시 횟수는 range_key 기준 집계.
export const POST = createApiHandler(
  { schema: vocaExamSaveSchema },
  async ({ user, body, supabase }) => {
    const { bookId, dayIds, score, wrongWords, assignmentId, examType } = body;
    const sortedDayIds = [...dayIds].sort();
    const rangeKey = sortedDayIds.join(',');

    // 같은 조합의 기존 응시 수 → 다음 시도 번호
    const { count } = await supabase
      .from('voca_exam_results')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('range_key', rangeKey)
      .eq('exam_type', examType);

    const attemptNumber = (count ?? 0) + 1;

    const { error } = await supabase.from('voca_exam_results').insert({
      student_id: user.id,
      book_id: bookId,
      day_ids: sortedDayIds,
      range_key: rangeKey,
      attempt_number: attemptNumber,
      score,
      wrong_words: wrongWords ?? [],
      assignment_id: assignmentId ?? null,
      exam_type: examType,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true, attemptNumber });
  }
);
