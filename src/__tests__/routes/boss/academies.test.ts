import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testBoss, testTeacher, testStudent, testAcademy } from '../../helpers/fixtures';

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
vi.mock('@/lib/utils/invite-code', () => ({
  generateInviteCode: () => 'TESTCD',
}));

function mockChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
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
  return new NextRequest('http://localhost/api/boss/academies', { ...init, headers } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('boss/academies', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('GET → boss가 학원 목록 조회', async () => {
    const { from } = mockChain({ data: [testAcademy], error: null });
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from });

    const { GET } = await import('@/app/api/boss/academies/route');
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].name).toBe('테스트학원');
  });

  it('GET → teacher 권한 없음 (403)', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { GET } = await import('@/app/api/boss/academies/route');
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(403);
  });

  it('GET → student 권한 없음 (403)', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { GET } = await import('@/app/api/boss/academies/route');
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(403);
  });

  it('POST → 학원 생성 (201)', async () => {
    const { from } = mockChain({
      data: { id: 'a-new', name: 'New Academy', invite_code: 'TESTCD' },
      error: null,
    });
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/boss/academies/route');
    const res = await POST(makeRequest('POST', { name: 'New Academy' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.invite_code).toBe('TESTCD');
  });

  it('POST → 빈 이름 → 400', async () => {
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/boss/academies/route');
    const res = await POST(makeRequest('POST', { name: '' }));
    expect(res.status).toBe(400);
  });

  it('POST → DB 에러 → 500', async () => {
    const { from } = mockChain({ data: null, error: { message: 'unique violation' } });
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/boss/academies/route');
    const res = await POST(makeRequest('POST', { name: 'Dup' }));
    expect(res.status).toBe(500);
  });

  it('미인증 → 401', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { GET } = await import('@/app/api/boss/academies/route');
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(401);
  });
});
