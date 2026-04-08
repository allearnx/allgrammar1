'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { ClassReviewStudent } from '@/lib/reports/compute-class-review';

function retentionColor(retention: number): string {
  if (retention < 30) return 'text-red-500';
  return 'text-amber-500';
}

interface Props {
  basePath: string;
}

export function ClassReviewOverview({ basePath }: Props) {
  const [data, setData] = useState<ClassReviewStudent[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithToast<ClassReviewStudent[]>('/api/teacher/review-overview', {
      method: 'GET',
      silent: true,
    })
      .then((res) => setData(res))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-5 md:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const visible = data.slice(0, 10);

  return (
    <div className="rounded-2xl border bg-white p-5 md:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-bold">학급 복습 현황</h3>
        </div>
        <span className="text-xs text-gray-400">망각 곡선 기반</span>
      </div>

      <div className="space-y-2">
        {visible.map((s) => (
          <Link
            key={s.studentId}
            href={`${basePath}/students/${s.studentId}`}
            className="flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 truncate">
                  {s.studentName}
                </span>
                <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                  복습 {s.reviewCount}개
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {s.urgentTopics.map((t) => (
                  <span key={t.topic} className="text-xs text-gray-500">
                    <span className="text-gray-700">{t.topic}</span>
                    <span className={`ml-0.5 font-bold ${retentionColor(t.retention)}`}>
                      ({t.retention}%)
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 ml-2" />
          </Link>
        ))}
      </div>
    </div>
  );
}
