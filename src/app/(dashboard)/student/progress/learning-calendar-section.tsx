'use client';

import { useQuery } from '@tanstack/react-query';
import { ActivityCalendar } from '@/components/charts/activity-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Loader2 } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { ActivityRecord } from '@/types/student-report';

interface CalendarData {
  dailySeconds: Record<string, number>;
  activities: ActivityRecord[];
}

export function LearningCalendarSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['learning-calendar'],
    queryFn: () =>
      fetchWithToast<CalendarData>('/api/student/learning-calendar', {
        method: 'GET',
        silent: true,
        logContext: 'student.learning_calendar',
      }),
    staleTime: 5 * 60_000, // 5min — 캘린더 데이터는 자주 안 바뀜
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <CalendarDays className="h-5 w-5 text-brand-500" />
        <CardTitle className="text-lg font-semibold tracking-tight">학습 캘린더</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
          </div>
        ) : data ? (
          <ActivityCalendar activities={data.activities} dailySeconds={data.dailySeconds} />
        ) : (
          <p className="text-sm text-gray-400 py-4 text-center">캘린더를 불러올 수 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
}
