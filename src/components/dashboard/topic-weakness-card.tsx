'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, ArrowRight } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { BRAND } from '@/lib/utils/brand-colors';
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
          <Target className="h-4 w-4 text-brand-500" />
          <h3 className="text-sm font-bold">나의 취약 토픽</h3>
        </div>
        <div className="flex items-center justify-center rounded-lg border border-dashed py-6">
          <p className="text-xs text-gray-400">문제를 풀면 취약 토픽이 표시돼요</p>
        </div>
      </div>
    );
  }

  const weakest = items[0]; // already sorted weakest-first
  const weakestLink = weakest.unitIds?.[0]
    ? `/student/naesin/${weakest.unitIds[0]}/problem`
    : null;

  return (
    <div className="rounded-2xl border bg-white p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-brand-500" />
        <h3 className="text-sm font-bold">나의 취약 토픽</h3>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => {
          const href = item.unitIds?.[0]
            ? `/student/naesin/${item.unitIds[0]}/problem`
            : null;

          const content = (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 truncate mr-2">{item.topic}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold" style={{ color: barColor(item.accuracy) }}>
                    {item.accuracy}%
                  </span>
                  {href && <ArrowRight className="h-3 w-3 text-gray-400" />}
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.accuracy}%`, backgroundColor: barColor(item.accuracy) }}
                />
              </div>
            </div>
          );

          return href ? (
            <Link key={item.topic} href={href} className="block rounded-lg hover:bg-gray-50 transition-colors -mx-1 px-1">
              {content}
            </Link>
          ) : (
            <div key={item.topic}>{content}</div>
          );
        })}
      </div>

      {/* CTA bar — 가장 약한 토픽 연습 */}
      {weakestLink && (
        <Link
          href={weakestLink}
          className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: BRAND.violet }}
        >
          <div className="text-xs">
            <span className="opacity-80">가장 약한 토픽: </span>
            <span className="font-bold">{weakest.topic}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold">
            연습하기
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      )}
    </div>
  );
}
