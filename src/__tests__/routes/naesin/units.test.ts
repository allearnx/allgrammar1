import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testTeacher, testStudent, testUnit } from '../../helpers/fixtures';

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

function mockChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
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

function makeRequest(method: string, body?: unknown) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }
  return new NextRequest('http://localhost/api/naesin/units', { ...init, headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('naesin/units', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('POST → 단원 생성', async () => {
    const { from } = mockChain({ data: testUnit, error: null });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/units/route');
    const res = await POST(makeRequest('POST', {
      textbook_id: 'textbook-1',
      unit_number: 1,
      title: 'Lesson 1',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('unit-1');
  });

  it('POST → student 권한 없음 (403)', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/naesin/units/route');
    const res = await POST(makeRequest('POST', {
      textbook_id: 'textbook-1',
      unit_number: 1,
      title: 'Lesson 1',
    }));
    expect(res.status).toBe(403);
  });

  it('PATCH → 단원 수정', async () => {
    const { from } = mockChain({ data: { ...testUnit, title: 'Updated' }, error: null });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { PATCH } = await import('@/app/api/naesin/units/route');
    const res = await PATCH(makeRequest('PATCH', { id: 'unit-1', title: 'Updated' }));
    expect(res.status).toBe(200);
  });

  it('DELETE → 단원 삭제', async () => {
    const { from } = mockChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { DELETE } = await import('@/app/api/naesin/units/route');
    const res = await DELETE(makeRequest('DELETE', { id: 'unit-1' }));
    expect(res.status).toBe(200);
  });

  it('POST → DB 에러 시 500', async () => {
    const { from } = mockChain({ data: null, error: { message: 'fk violation' } });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/units/route');
    const res = await POST(makeRequest('POST', {
      textbook_id: 'bad-id',
      unit_number: 1,
      title: 'Test',
    }));
    expect(res.status).toBe(500);
  });
});
