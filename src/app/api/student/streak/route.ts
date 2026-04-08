import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { computeStreak } from '@/lib/reports/compute-streak';

export const GET = createApiHandler(
  { roles: ['student'], hasBody: false },
  async ({ user, supabase }) => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data } = await supabase
      .from('learning_daily_log')
      .select('date, seconds')
      .eq('student_id', user.id)
      .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
      .order('date', { ascending: false });

    const dailySeconds: Record<string, number> = {};
    for (const row of data || []) {
      dailySeconds[row.date] = (dailySeconds[row.date] || 0) + row.seconds;
    }

    return NextResponse.json({ streak: computeStreak(dailySeconds) });
  },
);
