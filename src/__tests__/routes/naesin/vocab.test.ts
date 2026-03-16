import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testTeacher, testStudent, testVocab } from '../../helpers/fixtures';

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
  return new NextRequest('http://localhost/api/naesin/vocabulary', { ...init, headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('naesin/vocabulary', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('POST → 단어 추가', async () => {
    const { from } = mockChain({ data: testVocab, error: null });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/vocabulary/route');
    const res = await POST(makeRequest('POST', {
      unit_id: 'unit-1',
      front_text: 'apple',
      back_text: '사과',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.front_text).toBe('apple');
  });

  it('PATCH → 단어 수정', async () => {
    const { from } = mockChain({ data: { ...testVocab, back_text: '딸기' }, error: null });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { PATCH } = await import('@/app/api/naesin/vocabulary/route');
    const res = await PATCH(makeRequest('PATCH', { id: 'vocab-1', back_text: '딸기' }));
    expect(res.status).toBe(200);
  });

  it('DELETE → 단어 삭제', async () => {
    const { from } = mockChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { DELETE } = await import('@/app/api/naesin/vocabulary/route');
    const res = await DELETE(makeRequest('DELETE', { id: 'vocab-1' }));
    expect(res.status).toBe(200);
  });

  it('POST → student 권한 없음 (403)', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/naesin/vocabulary/route');
    const res = await POST(makeRequest('POST', {
      unit_id: 'unit-1',
      front_text: 'test',
      back_text: '테스트',
    }));
    expect(res.status).toBe(403);
  });

  it('POST → DB 에러 시 500', async () => {
    const { from } = mockChain({ data: null, error: { message: 'fk violation' } });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/vocabulary/route');
    const res = await POST(makeRequest('POST', {
      unit_id: 'bad-id',
      front_text: 'test',
      back_text: '테스트',
    }));
    expect(res.status).toBe(500);
  });
});
