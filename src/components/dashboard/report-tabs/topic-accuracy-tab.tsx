'use client';

import Link from 'next/link';
import { TopicAccuracyChart } from '@/components/charts/topic-accuracy-chart';
import { MiniScoreTrend } from '@/components/charts/mini-score-trend';
import { AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { computeReviewItems } from '@/lib/reports/forgetting-curve';
import type { TopicAccuracyItem } from '@/types/student-report';

interface Props {
  topicAccuracy: TopicAccuracyItem[];
  role?: 'teacher' | 'admin' | 'boss' | 'student' | 'parent';
}

function unitSummary(titles: string[]): string {
  if (titles.length === 0) return '';
  if (titles.length === 1) return titles[0];
  return `${titles[0]} 외 ${titles.length - 1}개 단원`;
}

export function TopicAccuracyTab({ topicAccuracy, role }: Props) {
  const isStudent = !role || role === 'student';

  // Weak topics: accuracy < 60 and at least 2 attempts
  const weakTopics = topicAccuracy
    .filter((t) => t.accuracy < 60 && t.attemptCount >= 2)
    .slice(0, 3);

  // Topics with trend data (for mini charts)
  const topicsWithTrend = topicAccuracy.filter((t) => t.trend.length >= 2);

  if (topicAccuracy.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-gray-400">아직 문제풀이 데이터가 없어요</p>
        <p className="text-xs text-gray-300 mt-1">문제를 풀면 토픽별 정답률이 분석돼요</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Full bar chart */}
      <div className="rounded-xl border p-4">
        <h3 className="font-semibold text-sm mb-3">토픽별 정답률</h3>
        <TopicAccuracyChart data={topicAccuracy} />
      </div>

      {/* 2. Weak topic highlight */}
      {weakTopics.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold text-sm text-amber-800">취약 토픽</h3>
          </div>
          <div className="space-y-2">
            {weakTopics.map((t) => {
              const href = isStudent && t.unitIds?.[0]
                ? `/student/naesin/${t.unitIds[0]}/problem`
                : null;
              const summary = unitSummary(t.unitTitles ?? []);

              return (
                <div key={t.topic} className="rounded-lg bg-white px-3 py-2 border border-amber-100">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-700">{t.topic}</span>
                      {summary && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{summary}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm shrink-0">
                      <span className="text-gray-500">{t.attemptCount}회 시도</span>
                      <span className="font-bold text-red-500">{t.accuracy}%</span>
                      {href && (
                        <Link href={href} className="flex items-center gap-0.5 text-xs font-semibold text-violet-600 hover:text-violet-700">
                          연습하기
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Review needed (forgetting curve) */}
      {(() => {
        const reviewItems = computeReviewItems(topicAccuracy).slice(0, 5);
        if (reviewItems.length === 0) return null;
        return (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-sm text-blue-800">복습 필요</h3>
              <span className="text-xs text-blue-400">망각 곡선 기반</span>
            </div>
            <div className="space-y-2">
              {reviewItems.map((r) => {
                const barColor = r.retention < 30 ? '#EF4444' : '#F59E0B';
                const href = isStudent && r.unitIds?.[0]
                  ? `/student/naesin/${r.unitIds[0]}/problem`
                  : null;

                return (
                  <div key={r.topic} className="rounded-lg bg-white px-3 py-2 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-700">{r.topic}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${r.retention}%`, backgroundColor: barColor }}
                            />
                          </div>
                          <span className="text-xs font-bold" style={{ color: barColor }}>
                            {r.retention}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm shrink-0 ml-3">
                        <span className="text-xs text-gray-400">{r.daysSince}일 전</span>
                        {href && (
                          <Link href={href} className="flex items-center gap-0.5 text-xs font-semibold text-violet-600 hover:text-violet-700">
                            연습하기
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 4. Mini trend charts per topic */}
      {topicsWithTrend.length > 0 && (
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">토픽별 추이</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {topicsWithTrend.slice(0, 6).map((t) => {
              const trendData = t.trend.map((w) => ({ date: w.week, score: w.accuracy }));
              const color = t.accuracy < 60 ? '#EF4444' : t.accuracy < 80 ? '#F59E0B' : '#22C55E';
              return (
                <div key={t.topic}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-600 truncate">{t.topic}</p>
                    <span className="text-xs font-bold" style={{ color }}>{t.accuracy}%</span>
                  </div>
                  <MiniScoreTrend data={trendData} color={color} height={48} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
