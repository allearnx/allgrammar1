import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testStudent, testTeacher, testBoss } from '../../helpers/fixtures';

const mockGetUser = vi.fn();
const mockCreateClient = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock('@/lib/auth/helpers', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));
vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimit: () => null,
}));
vi.mock('@/lib/api/audit', () => ({
  auditLog: vi.fn(),
}));
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  },
}));

// mock signInWithPassword (비밀번호 검증용)
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
  }),
}));

// mock createAdminClient (auth.users 삭제용)
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
    },
  }),
}));

function mockChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(result)),
  };
  for (const key of Object.keys(chain)) {
    if (key !== 'single' && key !== 'then') chain[key].mockReturnValue(chain);
  }
  return { from: vi.fn().mockReturnValue(chain), chain };
}

function makeRequest(body?: unknown) {
  const init: RequestInit = { method: 'POST' };
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }
  return new NextRequest('http://localhost/api/student/delete-account', { ...init, headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('student/delete-account', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('POST → 학생 계정 삭제 성공', async () => {
    const { from } = mockChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockDeleteUser.mockResolvedValue({ error: null });

    const { POST } = await import('@/app/api/student/delete-account/route');
    const res = await POST(makeRequest({ password: 'password123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // users 테이블 삭제 호출 확인
    expect(from).toHaveBeenCalledWith('users');
  });

  it('POST → 비밀번호 틀리면 400', async () => {
    const { from } = mockChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } });

    const { POST } = await import('@/app/api/student/delete-account/route');
    const res = await POST(makeRequest({ password: 'wrongpass' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('비밀번호가 올바르지 않습니다.');
  });

  it('POST → teacher 권한 없음 (403)', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/student/delete-account/route');
    const res = await POST(makeRequest({ password: 'password123' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('접근 권한이 없습니다.');
    expect(body.code).toBe('FORBIDDEN');
  });

  it('POST → boss 권한 없음 (403)', async () => {
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/student/delete-account/route');
    const res = await POST(makeRequest({ password: 'password123' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('접근 권한이 없습니다.');
    expect(body.code).toBe('FORBIDDEN');
  });

  it('POST → 비밀번호 누락 시 400 (validation)', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/student/delete-account/route');
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('입력값이 올바르지 않습니다.');
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('POST → 비밀번호 6자 미만 시 400 (validation)', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/student/delete-account/route');
    const res = await POST(makeRequest({ password: '123' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('입력값이 올바르지 않습니다.');
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('POST → 비로그인 시 401', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/student/delete-account/route');
    const res = await POST(makeRequest({ password: 'password123' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('로그인이 필요합니다.');
    expect(body.code).toBe('UNAUTHORIZED');
  });
});
