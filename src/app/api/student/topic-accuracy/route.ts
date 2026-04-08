import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { computeTopicAccuracy } from '@/lib/reports/compute-topic-accuracy';

export const GET = createApiHandler(
  { roles: ['student'], hasBody: false },
  async ({ user, supabase }) => {
    const { data: attempts } = await supabase
      .from('naesin_problem_attempts')
      .select('score, total_questions, created_at, unit_id, sheet_id')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    const topicAccuracy = await computeTopicAccuracy(supabase, attempts || []);
    return NextResponse.json(topicAccuracy);
  },
);
