import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockCheckRateLimit = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockAdminFrom }),
}));

function makeChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  for (const key of Object.keys(chain)) {
    if (key !== 'maybeSingle') chain[key].mockReturnValue(chain);
  }
  return chain;
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/find-email', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockResolvedValue(null);
});

describe('auth/find-email', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('이름+전화번호로 이메일 조회 → 마스킹된 이메일 반환', async () => {
    mockAdminFrom.mockReturnValue(makeChain({ data: { email: 'testuser@example.com' }, error: null }));

    const { POST } = await import('@/app/api/auth/find-email/route');
    const res = await POST(makeRequest({ name: '김학생', phone: '010-1234-5678' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('tes***@example.com');
  });

  it('이름 없음 → 400', async () => {
    const { POST } = await import('@/app/api/auth/find-email/route');
    const res = await POST(makeRequest({ phone: '010-1234-5678' }));
    expect(res.status).toBe(400);
  });

  it('전화번호 없음 → 400', async () => {
    const { POST } = await import('@/app/api/auth/find-email/route');
    const res = await POST(makeRequest({ name: '김학생' }));
    expect(res.status).toBe(400);
  });

  it('일치 없음 → 404', async () => {
    mockAdminFrom.mockReturnValue(makeChain({ data: null, error: null }));

    const { POST } = await import('@/app/api/auth/find-email/route');
    const res = await POST(makeRequest({ name: '없는사람', phone: '010-0000-0000' }));
    expect(res.status).toBe(404);
  });
});
