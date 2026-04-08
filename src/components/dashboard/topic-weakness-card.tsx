'use client';

import { useEffect, useState } from 'react';
import { Target } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { TopicAccuracyItem } from '@/types/student-report';

function barColor(accuracy: number): string {
  if (accuracy < 60) return '#EF4444';
  if (accuracy < 80) return '#F59E0B';
  return '#22C55E';
}

export function TopicWeaknessCard() {
  const [items, setItems] = useState<TopicAccuracyItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithToast<TopicAccuracyItem[]>('/api/student/topic-accuracy', {
      method: 'GET',
      silent: true,
    })
      .then((data) => setItems(data.slice(0, 5)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-3.5 w-20 rounded bg-gray-200 animate-pulse" />
                <div className="h-3.5 w-10 rounded bg-gray-200 animate-pulse" />
              </div>
              <div className="h-2 rounded-full bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-bold">나의 취약 토픽</h3>
        </div>
        <div className="flex items-center justify-center rounded-lg border border-dashed py-6">
          <p className="text-xs text-gray-400">문제를 풀면 취약 토픽이 표시돼요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-violet-500" />
        <h3 className="text-sm font-bold">나의 취약 토픽</h3>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.topic} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 truncate mr-2">{item.topic}</span>
              <span className="text-xs font-bold shrink-0" style={{ color: barColor(item.accuracy) }}>
                {item.accuracy}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.accuracy}%`, backgroundColor: barColor(item.accuracy) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
