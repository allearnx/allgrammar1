import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ──

const mockGetUser = vi.fn();
const mockCreateClient = vi.fn();

vi.mock('@/lib/auth/helpers', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimit: () => null,
}));

vi.mock('@/lib/api/require-content-permission', () => ({
  requireContentPermission: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/utils/invite-code', () => ({
  generateInviteCode: () => 'TESTCODE',
}));

// ── Helpers ──

function makeRequest(
  method: string,
  body?: unknown,
  url = 'http://localhost/api/test'
) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }

  return new NextRequest(url, { ...init, headers } as any);
}

function mockSupabaseChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(result)),
  };
  // Make chain methods return the chain (for chaining)
  for (const key of Object.keys(chain)) {
    if (key !== 'single' && key !== 'then') {
      chain[key].mockReturnValue(chain);
    }
  }
  return { from: vi.fn().mockReturnValue(chain), chain };
}

const fakeTeacher = {
  id: 'teacher-1',
  email: 'teacher@test.com',
  role: 'teacher' as const,
  full_name: 'Teacher',
  academy_id: 'academy-1',
  is_active: true,
};

const fakeStudent = {
  id: 'student-1',
  email: 'student@test.com',
  role: 'student' as const,
  full_name: 'Student',
  academy_id: 'academy-1',
  is_active: true,
};

const fakeBoss = {
  id: 'boss-1',
  email: 'boss@test.com',
  role: 'boss' as const,
  full_name: 'Boss',
  academy_id: null,
  is_active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Test suites ──

describe('naesin/passages', () => {
  beforeEach(async () => {
    // Dynamic import to get fresh handler per test
    vi.resetModules();
  });

  it('POST creates a passage (200)', async () => {
    const { from } = mockSupabaseChain({
      data: { id: 'p-1', title: 'Test' },
      error: null,
    });
    mockGetUser.mockResolvedValue(fakeTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/passages/route');
    const res = await POST(
      makeRequest('POST', {
        unit_id: 'u-1',
        title: 'Test',
        original_text: 'Hello world',
        korean_translation: '안녕 세계',
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('p-1');
  });

  it('POST returns 403 for student', async () => {
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/naesin/passages/route');
    const res = await POST(
      makeRequest('POST', {
        unit_id: 'u-1',
        title: 'Test',
        original_text: 'Hello',
        korean_translation: '안녕',
      })
    );
    expect(res.status).toBe(403);
  });

  it('DELETE returns 200', async () => {
    const { from } = mockSupabaseChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(fakeTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { DELETE } = await import('@/app/api/naesin/passages/route');
    const res = await DELETE(makeRequest('DELETE', { id: 'p-1' }));
    expect(res.status).toBe(200);
  });

  it('POST returns 500 on Supabase error', async () => {
    const { from } = mockSupabaseChain({
      data: null,
      error: { message: 'db error' },
    });
    mockGetUser.mockResolvedValue(fakeTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/passages/route');
    const res = await POST(
      makeRequest('POST', {
        unit_id: 'u-1',
        title: 'Test',
        original_text: 'Hello',
        korean_translation: '안녕',
      })
    );
    expect(res.status).toBe(500);
  });
});

describe('naesin/vocab-quiz-sets', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('GET returns data', async () => {
    const { from } = mockSupabaseChain({
      data: [{ id: 'qs-1' }],
      error: null,
    });
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { GET } = await import('@/app/api/naesin/vocab-quiz-sets/route');
    const res = await GET(
      makeRequest('GET', undefined, 'http://localhost/api/naesin/vocab-quiz-sets?unitId=u-1')
    );
    expect(res.status).toBe(200);
  });

  it('GET returns 400 without unitId', async () => {
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { GET } = await import('@/app/api/naesin/vocab-quiz-sets/route');
    const res = await GET(
      makeRequest('GET', undefined, 'http://localhost/api/naesin/vocab-quiz-sets')
    );
    expect(res.status).toBe(400);
  });

  it('DELETE returns 403 for student', async () => {
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { DELETE } = await import('@/app/api/naesin/vocab-quiz-sets/route');
    const res = await DELETE(makeRequest('DELETE', { id: 'qs-1' }));
    expect(res.status).toBe(403);
  });
});

describe('boss/academies', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('GET returns academies for boss', async () => {
    const { from } = mockSupabaseChain({
      data: [{ id: 'a-1', name: 'Academy' }],
      error: null,
    });
    mockGetUser.mockResolvedValue(fakeBoss);
    mockCreateClient.mockResolvedValue({ from });

    const { GET } = await import('@/app/api/boss/academies/route');
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET returns 403 for non-boss', async () => {
    mockGetUser.mockResolvedValue(fakeTeacher);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { GET } = await import('@/app/api/boss/academies/route');
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(403);
  });

  it('POST creates academy (201)', async () => {
    const { from } = mockSupabaseChain({
      data: { id: 'a-new', name: 'New Academy' },
      error: null,
    });
    mockGetUser.mockResolvedValue(fakeBoss);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/boss/academies/route');
    const res = await POST(makeRequest('POST', { name: 'New Academy' }));
    expect(res.status).toBe(201);
  });

  it('POST returns 500 on Supabase error', async () => {
    const { from } = mockSupabaseChain({
      data: null,
      error: { message: 'unique violation' },
    });
    mockGetUser.mockResolvedValue(fakeBoss);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/boss/academies/route');
    const res = await POST(makeRequest('POST', { name: 'Dup' }));
    expect(res.status).toBe(500);
  });
});

describe('naesin/vocabulary', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('POST creates vocabulary', async () => {
    const { from } = mockSupabaseChain({
      data: { id: 'v-1', front_text: 'apple' },
      error: null,
    });
    mockGetUser.mockResolvedValue(fakeTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/vocabulary/route');
    const res = await POST(
      makeRequest('POST', {
        unit_id: 'u-1',
        front_text: 'apple',
        back_text: '사과',
      })
    );
    expect(res.status).toBe(200);
  });

  it('DELETE returns 403 for student', async () => {
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { DELETE } = await import('@/app/api/naesin/vocabulary/route');
    const res = await DELETE(makeRequest('DELETE', { id: 'v-1' }));
    expect(res.status).toBe(403);
  });

  it('POST returns 500 on db error', async () => {
    const { from } = mockSupabaseChain({
      data: null,
      error: { message: 'fk violation' },
    });
    mockGetUser.mockResolvedValue(fakeTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/vocabulary/route');
    const res = await POST(
      makeRequest('POST', {
        unit_id: 'u-1',
        front_text: 'test',
        back_text: '테스트',
      })
    );
    expect(res.status).toBe(500);
  });
});

describe('voca/days', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('GET returns 400 without bookId', async () => {
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { GET } = await import('@/app/api/voca/days/route');
    const res = await GET(
      makeRequest('GET', undefined, 'http://localhost/api/voca/days')
    );
    expect(res.status).toBe(400);
  });

  it('POST returns 403 for student', async () => {
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/voca/days/route');
    const res = await POST(
      makeRequest('POST', { book_id: 'b-1', title: 'Day 1', sort_order: 1 })
    );
    expect(res.status).toBe(403);
  });
});

describe('authentication', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { GET } = await import('@/app/api/boss/academies/route');
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(401);
  });
});
