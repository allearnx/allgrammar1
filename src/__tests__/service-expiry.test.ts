import { describe, it, expect } from 'vitest';
import { computeExtendedExpiry, isAssignmentActive } from '@/lib/billing/service-expiry';

const NOW = new Date('2026-07-13T00:00:00.000Z');
const DAY = 86_400_000;

describe('computeExtendedExpiry', () => {
  it('기간 없는 코스(duration null)는 무기한(null) — 기존 동작 유지', () => {
    expect(computeExtendedExpiry(null, null, NOW)).toBeNull();
    expect(computeExtendedExpiry('2026-08-01T00:00:00.000Z', undefined, NOW)).toBeNull();
  });

  it('첫 결제(기존 만료 없음): 오늘 + 기간', () => {
    expect(computeExtendedExpiry(null, 30, NOW)).toBe(new Date(NOW.getTime() + 30 * DAY).toISOString());
    expect(computeExtendedExpiry(null, 180, NOW)).toBe(new Date(NOW.getTime() + 180 * DAY).toISOString());
  });

  it('만료 전 재결제: 남은 기간 위에 연장 (기존 만료일 + 기간)', () => {
    const existing = new Date(NOW.getTime() + 10 * DAY).toISOString(); // 10일 남음
    expect(computeExtendedExpiry(existing, 30, NOW)).toBe(new Date(NOW.getTime() + 40 * DAY).toISOString());
  });

  it('만료 후 재결제: 오늘부터 다시 기간 계산 (지난 만료일 무시)', () => {
    const past = new Date(NOW.getTime() - 5 * DAY).toISOString();
    expect(computeExtendedExpiry(past, 30, NOW)).toBe(new Date(NOW.getTime() + 30 * DAY).toISOString());
  });

  it('무기한 배정 보유자가 기간 코스 결제: 오늘 + 기간으로 전환', () => {
    expect(computeExtendedExpiry(null, 180, NOW)).toBe(new Date(NOW.getTime() + 180 * DAY).toISOString());
  });
});

describe('isAssignmentActive', () => {
  it('expires_at 없음(null/undefined) = 무기한 유효', () => {
    expect(isAssignmentActive({ expires_at: null }, NOW)).toBe(true);
    expect(isAssignmentActive({}, NOW)).toBe(true);
  });

  it('미래 만료일은 유효, 지난 만료일은 만료', () => {
    expect(isAssignmentActive({ expires_at: new Date(NOW.getTime() + DAY).toISOString() }, NOW)).toBe(true);
    expect(isAssignmentActive({ expires_at: new Date(NOW.getTime() - 1000).toISOString() }, NOW)).toBe(false);
  });

  it('정확히 만료 시각이면 만료 처리', () => {
    expect(isAssignmentActive({ expires_at: NOW.toISOString() }, NOW)).toBe(false);
  });
});
