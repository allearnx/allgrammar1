import { describe, it, expect, vi, afterEach } from 'vitest';
import { format, addDays } from 'date-fns';
import { calculateNextReview, isDueForReview } from '@/lib/memory/spaced-repetition';

// Freeze time for deterministic tests
const NOW = new Date('2026-03-04T12:00:00Z');

describe('calculateNextReview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('wrong answer (isCorrect = false)', () => {
    it('resets to interval 1 day regardless of current repetition', () => {
      for (const rep of [0, 1, 2, 3, 5]) {
        const result = calculateNextReview(rep, false);
        expect(result.nextIntervalDays).toBe(1);
        expect(result.newRepetitionCount).toBe(0);
        expect(result.isMastered).toBe(false);
      }
    });

    it('sets next review date to tomorrow', () => {
      const result = calculateNextReview(2, false);
      const expected = format(addDays(NOW, 1), 'yyyy-MM-dd');
      expect(result.nextReviewDate).toBe(expected);
    });
  });

  describe('correct answer progression', () => {
    // Ebbinghaus intervals: [1, 2, 7, 30]
    // rep 0 → correct → rep 1, interval = INTERVALS[1] = 2 days
    // rep 1 → correct → rep 2, interval = INTERVALS[2] = 7 days
    // rep 2 → correct → rep 3, interval = INTERVALS[3] = 30 days
    // rep 3 → correct → rep 4 >= 4 → mastered

    it('rep 0 → correct → 2 days, rep 1', () => {
      const result = calculateNextReview(0, true);
      expect(result.nextIntervalDays).toBe(2);
      expect(result.newRepetitionCount).toBe(1);
      expect(result.isMastered).toBe(false);
      expect(result.nextReviewDate).toBe(format(addDays(NOW, 2), 'yyyy-MM-dd'));
    });

    it('rep 1 → correct → 7 days, rep 2', () => {
      const result = calculateNextReview(1, true);
      expect(result.nextIntervalDays).toBe(7);
      expect(result.newRepetitionCount).toBe(2);
      expect(result.isMastered).toBe(false);
    });

    it('rep 2 → correct → 30 days, rep 3', () => {
      const result = calculateNextReview(2, true);
      expect(result.nextIntervalDays).toBe(30);
      expect(result.newRepetitionCount).toBe(3);
      expect(result.isMastered).toBe(false);
    });

    it('rep 3 → correct → mastered', () => {
      const result = calculateNextReview(3, true);
      expect(result.isMastered).toBe(true);
      expect(result.newRepetitionCount).toBe(4);
      expect(result.nextIntervalDays).toBe(30); // last interval
    });
  });

  describe('beyond max repetition', () => {
    it('rep 10 → correct → still mastered', () => {
      const result = calculateNextReview(10, true);
      expect(result.isMastered).toBe(true);
      expect(result.newRepetitionCount).toBe(11);
    });
  });
});

describe('isDueForReview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for past dates', () => {
    expect(isDueForReview('2026-03-01')).toBe(true);
    expect(isDueForReview('2025-12-25')).toBe(true);
  });

  it('returns true for today', () => {
    const today = format(NOW, 'yyyy-MM-dd');
    expect(isDueForReview(today)).toBe(true);
  });

  it('returns false for future dates', () => {
    expect(isDueForReview('2026-03-05')).toBe(false);
    expect(isDueForReview('2026-12-31')).toBe(false);
  });
});
