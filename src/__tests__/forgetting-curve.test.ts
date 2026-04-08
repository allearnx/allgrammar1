import { describe, it, expect } from 'vitest';
import { estimateRetention, computeReviewItems } from '@/lib/reports/forgetting-curve';
import type { TopicAccuracyItem } from '@/types/student-report';

describe('estimateRetention', () => {
  it('returns 100 when daysSince is 0', () => {
    expect(estimateRetention(80, 0, 5)).toBe(100);
  });

  it('returns 100 when daysSince is negative', () => {
    expect(estimateRetention(50, -1, 3)).toBe(100);
  });

  it('decays over time', () => {
    const r1 = estimateRetention(70, 1, 3);
    const r7 = estimateRetention(70, 7, 3);
    const r30 = estimateRetention(70, 30, 3);
    expect(r1).toBeGreaterThan(r7);
    expect(r7).toBeGreaterThan(r30);
  });

  it('higher accuracy leads to slower decay', () => {
    const low = estimateRetention(30, 5, 3);
    const high = estimateRetention(90, 5, 3);
    expect(high).toBeGreaterThan(low);
  });

  it('more attempts lead to slower decay', () => {
    const few = estimateRetention(60, 5, 1);
    const many = estimateRetention(60, 5, 10);
    expect(many).toBeGreaterThan(few);
  });

  it('returns value between 0 and 100', () => {
    const r = estimateRetention(50, 100, 1);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(100);
  });
});

describe('computeReviewItems', () => {
  const base: TopicAccuracyItem = {
    topic: '수여동사',
    totalCorrect: 8,
    totalQuestions: 10,
    accuracy: 80,
    attemptCount: 3,
    trend: [],
    unitIds: ['u1'],
    unitTitles: ['1단원 수여동사'],
  };

  it('filters out topics without lastStudiedAt', () => {
    const items = computeReviewItems([{ ...base }]);
    expect(items).toHaveLength(0);
  });

  it('filters out topics with high retention', () => {
    const recent = new Date().toISOString();
    const items = computeReviewItems([{ ...base, lastStudiedAt: recent }]);
    expect(items).toHaveLength(0);
  });

  it('includes topics with low retention and sorts by retention ascending', () => {
    const oldDate = new Date(Date.now() - 30 * 86400000).toISOString();
    const olderDate = new Date(Date.now() - 60 * 86400000).toISOString();
    const items = computeReviewItems([
      { ...base, topic: 'A', lastStudiedAt: oldDate },
      { ...base, topic: 'B', lastStudiedAt: olderDate },
    ]);
    expect(items.length).toBeGreaterThanOrEqual(1);
    if (items.length > 1) {
      expect(items[0].retention).toBeLessThanOrEqual(items[1].retention);
    }
  });

  it('sets needsReview=true for all returned items', () => {
    const old = new Date(Date.now() - 90 * 86400000).toISOString();
    const items = computeReviewItems([{ ...base, lastStudiedAt: old }]);
    for (const item of items) {
      expect(item.needsReview).toBe(true);
      expect(item.retention).toBeLessThan(50);
    }
  });
});
