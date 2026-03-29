import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testStudent, testTeacher } from '../../helpers/fixtures';

const mockGetUser = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock('@/lib/auth/helpers', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({}),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockAdminFrom }),
}));
vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimit: () => null,
}));

/** Build a chainable Supabase mock that supports .select().eq().eq().eq() etc. */
function mockChain(opts: { single?: unknown; count?: number } = {}) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = vi.fn(self);
  chain.update = vi.fn(self);
  chain.eq = vi.fn(self);
  chain.single = vi.fn().mockResolvedValue(opts.single ?? { data: null, error: null });
  // For count queries — the last .eq() returns { count }
  if (opts.count !== undefined) {
    chain.eq = vi.fn(() => ({ ...chain, count: opts.count }));
    // Ensure earlier .eq() calls still return chain for chaining
    const eqFn = vi.fn();
    let eqCallCount = 0;
    eqFn.mockImplementation(() => {
      eqCallCount++;
      // The 3rd .eq() is the last one in the count query (academy_id, role, is_active)
      if (eqCallCount >= 3) return { count: opts.count };
      return chain;
    });
    chain.eq = eqFn;
  }
  return chain;
}

function makeRequest(body?: unknown) {
  const init: RequestInit = { method: 'POST' };
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }
  return new NextRequest('http://localhost/api/auth/join-academy', {
    ...init,
    headers,
  } as any);
}

const freeAcademy = { id: 'academy-1', name: '테스트학원', max_students: 5 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('auth/join-academy', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('초대코드 없으면 400', async () => {
    mockGetUser.mockResolvedValue({ ...testStudent, academy_id: null });

    const { POST } = await import('@/app/api/auth/join-academy/route');
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('잘못된 코드 형식 → 400', async () => {
    mockGetUser.mockResolvedValue({ ...testStudent, academy_id: null });

    const { POST } = await import('@/app/api/auth/join-academy/route');
    const res = await POST(makeRequest({ inviteCode: 'AB' }));
    expect(res.status).toBe(400);
  });

  it('이미 학원 소속이면 400', async () => {
    mockGetUser.mockResolvedValue({ ...testStudent, academy_id: 'academy-1' });

    const { POST } = await import('@/app/api/auth/join-academy/route');
    const res = await POST(makeRequest({ inviteCode: 'ABC123' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('이미 학원에 소속');
  });

  it('존재하지 않는 코드 → 404', async () => {
    mockGetUser.mockResolvedValue({ ...testStudent, academy_id: null });
    const chain = mockChain({ single: { data: null, error: { message: 'not found' } } });
    mockAdminFrom.mockReturnValue(chain);

    const { POST } = await import('@/app/api/auth/join-academy/route');
    const res = await POST(makeRequest({ inviteCode: 'XXXXXX' }));
    expect(res.status).toBe(404);
  });

  it('학생 가입 성공 (좌석 여유) → 200', async () => {
    mockGetUser.mockResolvedValue({ ...testStudent, academy_id: null });

    let callCount = 0;
    mockAdminFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // academies lookup
        return mockChain({ single: { data: freeAcademy, error: null } });
      }
      if (callCount === 2) {
        // student count query — 3 students, under limit of 5
        return mockChain({ count: 3 });
      }
      // users update
      return mockChain({ single: { data: null, error: null } });
    });

    const { POST } = await import('@/app/api/auth/join-academy/route');
    const res = await POST(makeRequest({ inviteCode: 'ABC123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.academyName).toBe('테스트학원');
  });

  it('학생 좌석 초과 → 400', async () => {
    mockGetUser.mockResolvedValue({ ...testStudent, academy_id: null });

    let callCount = 0;
    mockAdminFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return mockChain({ single: { data: freeAcademy, error: null } });
      }
      // student count = max_students (5) → full
      return mockChain({ count: 5 });
    });

    const { POST } = await import('@/app/api/auth/join-academy/route');
    const res = await POST(makeRequest({ inviteCode: 'ABC123' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('최대 학생 수');
  });

  it('선생님은 좌석 제한 없이 가입 → 200', async () => {
    mockGetUser.mockResolvedValue({ ...testTeacher, academy_id: null });

    let callCount = 0;
    mockAdminFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return mockChain({ single: { data: freeAcademy, error: null } });
      }
      // users update (no seat check for teacher)
      return mockChain({ single: { data: null, error: null } });
    });

    const { POST } = await import('@/app/api/auth/join-academy/route');
    const res = await POST(makeRequest({ inviteCode: 'ABC123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
