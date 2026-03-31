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

// ── Helpers ──

function makeRequest(
  method: string,
  body?: unknown,
  url = 'http://localhost/api/learning/session'
) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }

  return new NextRequest(url, { ...init, headers } as any);
}

function makeTextPlainRequest(body: unknown) {
  return new NextRequest('http://localhost/api/learning/session', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'text/plain' },
  } as any);
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
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(result)),
  };
  for (const key of Object.keys(chain)) {
    if (key !== 'single' && key !== 'maybeSingle' && key !== 'then') {
      chain[key].mockReturnValue(chain);
    }
  }
  return { from: vi.fn().mockReturnValue(chain), chain };
}

const fakeStudent = {
  id: 'student-1',
  email: 'student@test.com',
  role: 'student' as const,
  full_name: 'Student',
  academy_id: 'academy-1',
  is_active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

// ── Schema Tests ──

describe('learningSessionHeartbeatSchema', () => {
  it('accepts valid naesin heartbeat', async () => {
    const { learningSessionHeartbeatSchema } = await import('@/lib/api/schemas');
    const result = learningSessionHeartbeatSchema.safeParse({
      contextType: 'naesin',
      contextId: 'unit-123',
      seconds: 30,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid voca heartbeat', async () => {
    const { learningSessionHeartbeatSchema } = await import('@/lib/api/schemas');
    const result = learningSessionHeartbeatSchema.safeParse({
      contextType: 'voca',
      contextId: 'day-456',
      seconds: 60,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid contextType', async () => {
    const { learningSessionHeartbeatSchema } = await import('@/lib/api/schemas');
    const result = learningSessionHeartbeatSchema.safeParse({
      contextType: 'grammar',
      contextId: 'x',
      seconds: 30,
    });
    expect(result.success).toBe(false);
  });

  it('rejects seconds below 1', async () => {
    const { learningSessionHeartbeatSchema } = await import('@/lib/api/schemas');
    const result = learningSessionHeartbeatSchema.safeParse({
      contextType: 'naesin',
      contextId: 'u1',
      seconds: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects seconds above 120', async () => {
    const { learningSessionHeartbeatSchema } = await import('@/lib/api/schemas');
    const result = learningSessionHeartbeatSchema.safeParse({
      contextType: 'naesin',
      contextId: 'u1',
      seconds: 121,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer seconds', async () => {
    const { learningSessionHeartbeatSchema } = await import('@/lib/api/schemas');
    const result = learningSessionHeartbeatSchema.safeParse({
      contextType: 'naesin',
      contextId: 'u1',
      seconds: 30.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing contextId', async () => {
    const { learningSessionHeartbeatSchema } = await import('@/lib/api/schemas');
    const result = learningSessionHeartbeatSchema.safeParse({
      contextType: 'naesin',
      seconds: 30,
    });
    expect(result.success).toBe(false);
  });
});

// ── API Route Tests ──

describe('POST /api/learning/session', () => {
  it('returns 200 for naesin heartbeat (existing row)', async () => {
    const { from, chain } = mockSupabaseChain({
      data: { total_learning_seconds: 100 },
      error: null,
    });
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/learning/session/route');
    const res = await POST(
      makeRequest('POST', {
        contextType: 'naesin',
        contextId: 'unit-1',
        seconds: 30,
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify it called from('naesin_student_progress')
    expect(from).toHaveBeenCalledWith('naesin_student_progress');
  });

  it('returns 200 for voca heartbeat (existing row)', async () => {
    const { from } = mockSupabaseChain({
      data: { total_learning_seconds: 50 },
      error: null,
    });
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/learning/session/route');
    const res = await POST(
      makeRequest('POST', {
        contextType: 'voca',
        contextId: 'day-1',
        seconds: 30,
      })
    );
    expect(res.status).toBe(200);
    expect(from).toHaveBeenCalledWith('voca_student_progress');
  });

  it('returns 200 for naesin heartbeat (new row - insert)', async () => {
    // maybeSingle returns null (no existing row), then insert succeeds
    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: null, error: null })),
    };
    for (const key of Object.keys(chain)) {
      if (key !== 'maybeSingle' && key !== 'then') {
        chain[key].mockReturnValue(chain);
      }
    }
    const from = vi.fn().mockReturnValue(chain);
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/learning/session/route');
    const res = await POST(
      makeRequest('POST', {
        contextType: 'naesin',
        contextId: 'unit-new',
        seconds: 30,
      })
    );
    expect(res.status).toBe(200);
  });

  it('handles sendBeacon text/plain content-type', async () => {
    const { from } = mockSupabaseChain({
      data: { total_learning_seconds: 60 },
      error: null,
    });
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/learning/session/route');
    const res = await POST(
      makeTextPlainRequest({
        contextType: 'naesin',
        contextId: 'unit-1',
        seconds: 15,
      })
    );
    expect(res.status).toBe(200);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/learning/session/route');
    const res = await POST(
      makeRequest('POST', {
        contextType: 'naesin',
        contextId: 'unit-1',
        seconds: 30,
      })
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/learning/session/route');
    const res = await POST(
      makeRequest('POST', {
        contextType: 'invalid',
        contextId: 'unit-1',
        seconds: 30,
      })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for seconds out of range', async () => {
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/learning/session/route');
    const res = await POST(
      makeRequest('POST', {
        contextType: 'naesin',
        contextId: 'unit-1',
        seconds: 200,
      })
    );
    expect(res.status).toBe(400);
  });
});
