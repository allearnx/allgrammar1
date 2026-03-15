import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testAdmin, testStudent, testBoss } from '../helpers/fixtures';

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

function mockSupabaseChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
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
  return new NextRequest('http://localhost/api/service-assignments', { ...init, headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('service-assignments', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('GET → 학생 본인 배정 목록 반환', async () => {
    const { from } = mockSupabaseChain({ data: [{ id: 'sa-1', service: 'naesin' }], error: null });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { GET } = await import('@/app/api/service-assignments/route');
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(200);
  });

  it('POST → boss가 서비스 배정 생성', async () => {
    const { from } = mockSupabaseChain({
      data: { id: 'sa-new', student_id: 'student-1', service: 'naesin' },
      error: null,
    });
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/service-assignments/route');
    const res = await POST(makeRequest('POST', { studentId: 'student-1', service: 'naesin' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.student_id).toBe('student-1');
  });

  it('POST → admin도 서비스 배정 가능', async () => {
    const { from } = mockSupabaseChain({
      data: { id: 'sa-new', student_id: 'student-1', service: 'voca' },
      error: null,
    });
    mockGetUser.mockResolvedValue(testAdmin);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/service-assignments/route');
    const res = await POST(makeRequest('POST', { studentId: 'student-1', service: 'voca' }));
    expect(res.status).toBe(200);
  });

  it('POST → student 권한 없음 (403)', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/service-assignments/route');
    const res = await POST(makeRequest('POST', { studentId: 'student-1', service: 'naesin' }));
    expect(res.status).toBe(403);
  });

  it('DELETE → 서비스 배정 해제', async () => {
    const { from } = mockSupabaseChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from });

    const { DELETE } = await import('@/app/api/service-assignments/route');
    const res = await DELETE(makeRequest('DELETE', { studentId: 'student-1', service: 'naesin' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('DELETE → student 권한 없음 (403)', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { DELETE } = await import('@/app/api/service-assignments/route');
    const res = await DELETE(makeRequest('DELETE', { studentId: 'student-1', service: 'naesin' }));
    expect(res.status).toBe(403);
  });

  it('미인증 → 401', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { GET } = await import('@/app/api/service-assignments/route');
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(401);
  });
});
