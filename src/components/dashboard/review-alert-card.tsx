'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, ArrowRight } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { BRAND } from '@/lib/utils/brand-colors';
import { computeReviewItems, type ReviewItem } from '@/lib/reports/forgetting-curve';
import type { TopicAccuracyItem } from '@/types/student-report';

function retentionColor(retention: number): string {
  if (retention < 30) return '#EF4444';
  return '#F59E0B';
}

export function ReviewAlertCard() {
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithToast<TopicAccuracyItem[]>('/api/student/topic-accuracy', {
      method: 'GET',
      silent: true,
    })
      .then((data) => setItems(computeReviewItems(data).slice(0, 5)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

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

  // 복습 필요 토픽이 없으면 카드 숨김
  if (!items || items.length === 0) return null;

  const urgent = items[0];
  const urgentLink = urgent.unitIds?.[0]
    ? `/student/naesin/${urgent.unitIds[0]}/problem`
    : null;

  return (
    <div className="rounded-2xl border bg-white p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-bold">복습 알림</h3>
        <span className="ml-auto text-[10px] text-gray-400">망각 곡선 기반</span>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => {
          const href = item.unitIds?.[0]
            ? `/student/naesin/${item.unitIds[0]}/problem`
            : null;
          const color = retentionColor(item.retention);

          const content = (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 truncate mr-2">{item.topic}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-gray-400">{item.daysSince}일 전</span>
                  <span className="text-xs font-bold" style={{ color }}>
                    {item.retention}%
                  </span>
                  {href && <ArrowRight className="h-3 w-3 text-gray-400" />}
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.retention}%`, backgroundColor: color }}
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

      {urgentLink && (
        <Link
          href={urgentLink}
          className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: BRAND.amber }}
        >
          <div className="text-xs">
            <span className="opacity-80">가장 급한 복습: </span>
            <span className="font-bold">{urgent.topic}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold">
            복습하기
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      )}
    </div>
  );
}
