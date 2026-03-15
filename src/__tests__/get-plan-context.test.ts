import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

const mockCreateClient = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

// ── Helpers ──

function mockSupabaseChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(result)),
  };
  for (const key of Object.keys(chain)) {
    if (key !== 'single' && key !== 'then') {
      chain[key].mockReturnValue(chain);
    }
  }
  return chain;
}

function mockSupabaseMultiTable(tableResults: Record<string, { data: unknown; error: unknown }>) {
  const from = vi.fn((table: string) => {
    const result = tableResults[table] ?? { data: null, error: null };
    return mockSupabaseChain(result);
  });
  return { from };
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('getPlanContext', () => {
  // ── academyId=null, no studentId ──
  it('no academyId, no studentId → free tier, null freeService', async () => {
    const { getPlanContext } = await import('@/lib/billing/get-plan-context');
    const result = await getPlanContext(null);
    expect(result).toEqual({ tier: 'free', freeService: null });
  });

  // ── 독립 학생: voca 배정 있음 ──
  it('no academyId + studentId with voca assignment → free tier, voca', async () => {
    const supabase = mockSupabaseMultiTable({
      service_assignments: {
        data: [{ service: 'voca' }],
        error: null,
      },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const { getPlanContext } = await import('@/lib/billing/get-plan-context');
    const result = await getPlanContext(null, 'student-1');

    expect(result).toEqual({ tier: 'free', freeService: 'voca' });
    expect(supabase.from).toHaveBeenCalledWith('service_assignments');
  });

  // ── 독립 학생: naesin 배정 있음 ──
  it('no academyId + studentId with naesin assignment → free tier, naesin', async () => {
    const supabase = mockSupabaseMultiTable({
      service_assignments: {
        data: [{ service: 'naesin' }],
        error: null,
      },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const { getPlanContext } = await import('@/lib/billing/get-plan-context');
    const result = await getPlanContext(null, 'student-2');

    expect(result).toEqual({ tier: 'free', freeService: 'naesin' });
  });

  // ── 독립 학생: 둘 다 배정 (voca 우선) ──
  it('no academyId + studentId with both assignments → free tier, voca', async () => {
    const supabase = mockSupabaseMultiTable({
      service_assignments: {
        data: [{ service: 'voca' }, { service: 'naesin' }],
        error: null,
      },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const { getPlanContext } = await import('@/lib/billing/get-plan-context');
    const result = await getPlanContext(null, 'student-both');

    expect(result).toEqual({ tier: 'free', freeService: 'voca' });
  });

  // ── 독립 학생: 배정 없음 ──
  it('no academyId + studentId with no assignments → free tier, null', async () => {
    const supabase = mockSupabaseMultiTable({
      service_assignments: { data: [], error: null },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const { getPlanContext } = await import('@/lib/billing/get-plan-context');
    const result = await getPlanContext(null, 'student-no-assign');

    expect(result).toEqual({ tier: 'free', freeService: null });
  });

  // ── 독립 학생: data가 null ──
  it('no academyId + studentId with null data → free tier, null', async () => {
    const supabase = mockSupabaseMultiTable({
      service_assignments: { data: null, error: { code: 'PGRST116' } },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const { getPlanContext } = await import('@/lib/billing/get-plan-context');
    const result = await getPlanContext(null, 'student-null');

    expect(result).toEqual({ tier: 'free', freeService: null });
  });

  // ── 학원 학생: 기존 로직 (subscriptions 테이블 사용) ──
  it('academyId with active paid subscription → paid tier', async () => {
    const supabase = mockSupabaseMultiTable({
      academies: { data: { free_service: 'voca' }, error: null },
      subscriptions: { data: { status: 'active', tier: 'paid' }, error: null },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const { getPlanContext } = await import('@/lib/billing/get-plan-context');
    const result = await getPlanContext('academy-1');

    expect(result).toEqual({ tier: 'paid', freeService: 'voca' });
  });

  it('academyId with free subscription → free tier + freeService', async () => {
    const supabase = mockSupabaseMultiTable({
      academies: { data: { free_service: 'naesin' }, error: null },
      subscriptions: { data: { status: 'active', tier: 'free' }, error: null },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const { getPlanContext } = await import('@/lib/billing/get-plan-context');
    const result = await getPlanContext('academy-2');

    expect(result).toEqual({ tier: 'free', freeService: 'naesin' });
  });

  it('academyId with no subscription → free tier', async () => {
    const supabase = mockSupabaseMultiTable({
      academies: { data: { free_service: null }, error: null },
      subscriptions: { data: null, error: { code: 'PGRST116' } },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const { getPlanContext } = await import('@/lib/billing/get-plan-context');
    const result = await getPlanContext('academy-3');

    expect(result).toEqual({ tier: 'free', freeService: null });
  });
});
