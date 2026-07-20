import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * 학원 계약 서비스 제한 게이트 (2026-07-20).
 * 올킬보카 학원 플랜(services=['voca'])은 올인내신 배정이 차단되어야 하고,
 * services가 빈 배열인 기존 학원은 제한 없이 동작해야 한다.
 */

const mockSingle = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
    }),
  }),
}));
vi.mock('@/lib/billing/get-plan-context', () => ({
  getPlanContext: vi.fn().mockResolvedValue({ tier: 'paid', freeService: null, naesinMemorizeOnly: false }),
}));

import { checkServiceGate } from '@/lib/billing/check-plan-api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('checkServiceGate — 학원 계약 서비스 제한', () => {
  it("보카 전용 학원(services=['voca'])에 naesin 배정 → 403 차단", async () => {
    mockSingle.mockResolvedValue({ data: { services: ['voca'] } });
    const res = await checkServiceGate('academy-1', ['naesin']);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const json = await res!.json();
    expect(json.error).toContain('올인내신');
  });

  it("보카 전용 학원에 voca 배정 → 허용", async () => {
    mockSingle.mockResolvedValue({ data: { services: ['voca'] } });
    const res = await checkServiceGate('academy-1', ['voca']);
    expect(res).toBeNull();
  });

  it('services가 빈 배열인 기존 학원 → 제한 없음 (naesin·voca 모두 허용)', async () => {
    mockSingle.mockResolvedValue({ data: { services: [] } });
    const res = await checkServiceGate('academy-1', ['naesin', 'voca']);
    expect(res).toBeNull();
  });

  it('개인 학생(academyId null) → 학원 제한 미적용', async () => {
    const res = await checkServiceGate(null, ['naesin']);
    expect(res).toBeNull();
    expect(mockSingle).not.toHaveBeenCalled();
  });
});
