import { describe, it, expect } from 'vitest';
import { scoreChipClass, progressBorderClass } from '@/lib/utils/progress-styles';

describe('scoreChipClass', () => {
  it('returns empty string for null score', () => {
    expect(scoreChipClass(null)).toBe('');
  });

  it('returns green class for score >= 80', () => {
    expect(scoreChipClass(90)).toContain('green');
  });

  it('returns slate class for score < 80', () => {
    expect(scoreChipClass(79)).toContain('slate');
  });

  it('uses green for boundary value 80 (>=)', () => {
    expect(scoreChipClass(80)).toContain('green');
  });

  it('respects custom threshold', () => {
    expect(scoreChipClass(60, 50)).toContain('green');
    expect(scoreChipClass(40, 50)).toContain('slate');
  });
});

describe('progressBorderClass', () => {
  it('returns green border when completed equals total', () => {
    expect(progressBorderClass(5, 5)).toContain('green');
  });

  it('returns amber border when partially completed', () => {
    expect(progressBorderClass(3, 5)).toContain('amber');
  });

  it('returns slate border when nothing completed', () => {
    expect(progressBorderClass(0, 5)).toContain('slate');
  });
});
