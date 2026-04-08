'use client';

import type { TopicAccuracyItem } from '@/types/student-report';

interface Props {
  data: TopicAccuracyItem[];
  maxItems?: number;
}

function barColor(accuracy: number): string {
  if (accuracy < 60) return '#EF4444';   // red
  if (accuracy < 80) return '#F59E0B';   // amber
  return '#22C55E';                       // green
}

function bgColor(accuracy: number): string {
  if (accuracy < 60) return 'bg-red-50';
  if (accuracy < 80) return 'bg-amber-50';
  return 'bg-green-50';
}

export function TopicAccuracyChart({ data, maxItems }: Props) {
  const items = maxItems ? data.slice(0, maxItems) : data;

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed py-10">
        <p className="text-sm text-gray-400">문제를 풀면 토픽별 정답률이 표시돼요</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.topic} className={`rounded-lg px-3 py-2.5 ${bgColor(item.accuracy)}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-gray-800 truncate mr-2">{item.topic}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500">{item.totalCorrect}/{item.totalQuestions}</span>
              <span className="text-sm font-bold" style={{ color: barColor(item.accuracy) }}>
                {item.accuracy}%
              </span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-gray-200/60 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${item.accuracy}%`, backgroundColor: barColor(item.accuracy) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
