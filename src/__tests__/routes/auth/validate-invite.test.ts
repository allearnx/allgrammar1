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
    single: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockResolvedValue(null);
});

describe('auth/validate-invite-code', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('유효한 코드 → 학원명 반환 (200)', async () => {
    mockAdminFrom.mockReturnValue(makeChain({ data: { name: '테스트학원' }, error: null }));

    const { GET } = await import('@/app/api/auth/validate-invite-code/route');
    const res = await GET(
      new NextRequest('http://localhost/api/auth/validate-invite-code?code=ABC123')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.academyName).toBe('테스트학원');
  });

  it('코드 없음 → 400', async () => {
    const { GET } = await import('@/app/api/auth/validate-invite-code/route');
    const res = await GET(
      new NextRequest('http://localhost/api/auth/validate-invite-code')
    );
    expect(res.status).toBe(400);
  });

  it('잘못된 형식 코드 (5자) → 400', async () => {
    const { GET } = await import('@/app/api/auth/validate-invite-code/route');
    const res = await GET(
      new NextRequest('http://localhost/api/auth/validate-invite-code?code=ABCDE')
    );
    expect(res.status).toBe(400);
  });

  it('존재하지 않는 코드 → 404', async () => {
    mockAdminFrom.mockReturnValue(makeChain({ data: null, error: { message: 'not found' } }));

    const { GET } = await import('@/app/api/auth/validate-invite-code/route');
    const res = await GET(
      new NextRequest('http://localhost/api/auth/validate-invite-code?code=XXXXXX')
    );
    expect(res.status).toBe(404);
  });
});
