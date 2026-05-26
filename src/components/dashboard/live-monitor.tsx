'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

type Status = 'learning' | 'online' | 'offline';

interface StudentActivity {
  id: string;
  name: string;
  status: Status;
  currentActivity: {
    type: 'naesin' | 'voca';
    label: string;
    stage: string | null;
    round?: number;
    updatedAt: string;
  } | null;
  todaySeconds: number;
  naesinProgress: { completed: number; total: number };
}

interface MonitorData {
  students: StudentActivity[];
  learningCount: number;
  onlineCount: number;
  totalCount: number;
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return '0분';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const STATUS_CONFIG: Record<Status, { dot: string; card: string; label: string }> = {
  learning: {
    dot: 'bg-green-500',
    card: 'border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/20',
    label: '학습 중',
  },
  online: {
    dot: 'bg-yellow-400',
    card: 'border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-950/20',
    label: '접속 중',
  },
  offline: {
    dot: 'bg-gray-300 dark:bg-gray-600',
    card: '',
    label: '미접속',
  },
};

const POLL_INTERVAL = 60_000;

async function fetchMonitorData(): Promise<MonitorData> {
  const res = await fetch('/api/live-monitor');
  if (!res.ok) throw new Error('live-monitor fetch failed');
  return res.json();
}

export function LiveMonitorClient({ basePath }: { basePath: string }) {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['live-monitor'],
    queryFn: fetchMonitorData,
    refetchInterval: POLL_INTERVAL,
    staleTime: POLL_INTERVAL,
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const loading = isLoading;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        불러오는 중...
      </div>
    );
  }

  if (!data || data.totalCount === 0) {
    return (
      <div className="px-4 py-10 text-center text-muted-foreground sm:px-6">
        소속 학생이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6">
      {/* Summary header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">전체 {data.totalCount}명</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              학습 중 {data.learningCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
              접속 중 {data.onlineCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
              미접속 {data.totalCount - data.learningCount - data.onlineCount}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {lastUpdated && `${formatTime(lastUpdated)} 갱신`}
          {' · '}1분마다 자동 갱신
        </p>
      </div>

      {/* Student cards */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.students.map((student) => {
          const cfg = STATUS_CONFIG[student.status];
          return (
            <Link key={student.id} href={`${basePath}/students/${student.id}`}>
              <Card className={`transition-colors hover:bg-accent/50 ${cfg.card}`}>
                <CardContent className="flex items-center gap-3 p-3">
                  {/* Status dot */}
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{student.name}</p>
                    {student.status === 'learning' && student.currentActivity ? (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant={student.currentActivity.type === 'naesin' ? 'default' : 'secondary'} className="text-[11px]">
                          {student.currentActivity.type === 'naesin' ? '내신' : '보카'}
                        </Badge>
                        <span className="truncate text-xs text-muted-foreground">
                          {student.currentActivity.label}
                          {student.currentActivity.stage && ` · ${student.currentActivity.stage}`}
                          {student.currentActivity.round && student.currentActivity.round >= 2 && ' (2회독)'}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">{cfg.label}</p>
                    )}
                  </div>

                  {/* Today time */}
                  <span className="shrink-0 text-xs text-muted-foreground">
                    오늘 {formatSeconds(student.todaySeconds)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
