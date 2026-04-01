'use client';

import { useEffect, useState } from 'react';
import { ActivityCalendar } from '@/components/charts/activity-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Loader2 } from 'lucide-react';
import type { ActivityRecord } from '@/types/student-report';

interface CalendarData {
  dailySeconds: Record<string, number>;
  activities: ActivityRecord[];
}

export function LearningCalendarSection() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/learning-calendar')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <CalendarDays className="h-5 w-5 text-violet-500" />
        <CardTitle className="text-lg font-semibold tracking-tight">학습 캘린더</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
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
