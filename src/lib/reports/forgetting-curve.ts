import type { TopicAccuracyItem } from '@/types/student-report';

export interface ReviewItem {
  topic: string;
  accuracy: number;
  daysSince: number;
  retention: number;       // 0-100 (추정 기억 보존율)
  needsReview: boolean;    // retention < 50
  unitIds: string[];
  unitTitles: string[];
}

const BASE_STABILITY = 3;

export function estimateRetention(accuracy: number, daysSince: number, attemptCount: number): number {
  if (daysSince <= 0) return 100;
  const stability = BASE_STABILITY * (1 + accuracy / 100) * Math.log(1 + attemptCount);
  return Math.round(Math.exp(-daysSince / Math.max(stability, 0.5)) * 100);
}

export function computeReviewItems(topics: TopicAccuracyItem[]): ReviewItem[] {
  const now = Date.now();
  return topics
    .filter((t) => t.lastStudiedAt)
    .map((t) => {
      const daysSince = Math.floor((now - new Date(t.lastStudiedAt!).getTime()) / 86400000);
      const retention = estimateRetention(t.accuracy, daysSince, t.attemptCount);
      return {
        topic: t.topic, accuracy: t.accuracy, daysSince, retention,
        needsReview: retention < 50, unitIds: t.unitIds, unitTitles: t.unitTitles,
      };
    })
    .filter((r) => r.needsReview)
    .sort((a, b) => a.retention - b.retention);
}
