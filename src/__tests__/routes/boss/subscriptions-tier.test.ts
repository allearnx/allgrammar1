import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testBoss, testAdmin, testStudent } from '../../helpers/fixtures';

const mockGetUser = vi.fn();
const mockCreateClient = vi.fn();
const mockCreateAdminClient = vi.fn();

vi.mock('@/lib/auth/helpers', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}));
vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimit: () => null,
}));
vi.mock('@/lib/api/audit', () => ({
  auditLog: vi.fn(),
}));

/** Create a chainable Supabase mock that resolves to `result` */
function mockChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(result)),
  };
  for (const key of Object.keys(chain)) {
    if (key !== 'single' && key !== 'then') chain[key].mockReturnValue(chain);
  }
  return { from: vi.fn().mockReturnValue(chain), chain };
}

function makeRequest(method: string, body?: unknown) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }
  return new NextRequest('http://localhost/api/boss/subscriptions/sub-1', { ...init, headers } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('boss/subscriptions/[id] PATCH — tier 변경', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('무료→유료 전환 성공', async () => {
    // supabase (user client) — 구독 조회용
    const userChain = mockChain({
      data: {
        id: 'sub-1',
        tier: 'free',
        academy_id: 'academy-1',
        plan: { min_students: 10 },
      },
      error: null,
    });
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from: userChain.from });

    // admin client — 업데이트용
    const adminChain = mockChain({ data: null, error: null });
    mockCreateAdminClient.mockReturnValue({ from: adminChain.from });

    const { PATCH } = await import('@/app/api/boss/subscriptions/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { tier: 'paid' }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe('paid');

    // admin client로 subscriptions 업데이트 확인
    expect(adminChain.from).toHaveBeenCalledWith('subscriptions');
    // admin client로 academies 업데이트 확인
    expect(adminChain.from).toHaveBeenCalledWith('academies');
  });

  it('유료→무료 다운그레이드 성공', async () => {
    const userChain = mockChain({
      data: {
        id: 'sub-1',
        tier: 'paid',
        academy_id: 'academy-1',
        plan: { min_students: 10 },
      },
      error: null,
    });
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from: userChain.from });

    const adminChain = mockChain({ data: null, error: null });
    mockCreateAdminClient.mockReturnValue({ from: adminChain.from });

    const { PATCH } = await import('@/app/api/boss/subscriptions/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { tier: 'free' }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe('free');
  });

  it('동일 tier 변경 → 400', async () => {
    const userChain = mockChain({
      data: { id: 'sub-1', tier: 'free', academy_id: 'academy-1', plan: null },
      error: null,
    });
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from: userChain.from });

    const { PATCH } = await import('@/app/api/boss/subscriptions/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { tier: 'free' }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('동일한 tier');
  });

  it('잘못된 tier 값 → 400', async () => {
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { PATCH } = await import('@/app/api/boss/subscriptions/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { tier: 'enterprise' }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );

    expect(res.status).toBe(400);
  });

  it('admin 권한 없음 → 403', async () => {
    mockGetUser.mockResolvedValue(testAdmin);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { PATCH } = await import('@/app/api/boss/subscriptions/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { tier: 'paid' }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );

    expect(res.status).toBe(403);
  });

  it('student 권한 없음 → 403', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { PATCH } = await import('@/app/api/boss/subscriptions/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { tier: 'paid' }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );

    expect(res.status).toBe(403);
  });

  it('미인증 → 401', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { PATCH } = await import('@/app/api/boss/subscriptions/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { tier: 'paid' }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );

    expect(res.status).toBe(401);
  });

  it('학원 없는 개인 구독 → academies 업데이트 안 함', async () => {
    const userChain = mockChain({
      data: {
        id: 'sub-1',
        tier: 'free',
        academy_id: null,
        plan: { min_students: null },
      },
      error: null,
    });
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from: userChain.from });

    const adminChain = mockChain({ data: null, error: null });
    mockCreateAdminClient.mockReturnValue({ from: adminChain.from });

    const { PATCH } = await import('@/app/api/boss/subscriptions/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { tier: 'paid' }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );

    expect(res.status).toBe(200);
    // subscriptions만 업데이트, academies는 호출 안 됨
    const calls = adminChain.from.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls).toContain('subscriptions');
    expect(calls).not.toContain('academies');
  });
});
