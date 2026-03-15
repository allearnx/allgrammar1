import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testTeacher, testStudent, testPassage } from '../../helpers/fixtures';

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
  return new NextRequest('http://localhost/api/naesin/passages', { ...init, headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('naesin/passages', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('POST → 지문 생성', async () => {
    const { from } = mockChain({ data: testPassage, error: null });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/passages/route');
    const res = await POST(makeRequest('POST', {
      unit_id: 'unit-1',
      title: 'Test Passage',
      original_text: 'Hello world. This is a test.',
      korean_translation: '안녕 세계. 이것은 테스트입니다.',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('passage-1');
  });

  it('POST → student 권한 없음 (403)', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/naesin/passages/route');
    const res = await POST(makeRequest('POST', {
      unit_id: 'unit-1',
      title: 'Test',
      original_text: 'Hello',
      korean_translation: '안녕',
    }));
    expect(res.status).toBe(403);
  });

  it('PATCH → 지문 수정 (sentences 포함 시 blanks 재생성)', async () => {
    const { from } = mockChain({
      data: { ...testPassage, title: 'Updated' },
      error: null,
    });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { PATCH } = await import('@/app/api/naesin/passages/route');
    const res = await PATCH(makeRequest('PATCH', {
      id: 'passage-1',
      sentences: [
        { original: 'New sentence one.', korean: '새 문장 하나.' },
        { original: 'New sentence two.', korean: '새 문장 둘.' },
      ],
    }));
    expect(res.status).toBe(200);
  });

  it('DELETE → 지문 삭제', async () => {
    const { from } = mockChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { DELETE } = await import('@/app/api/naesin/passages/route');
    const res = await DELETE(makeRequest('DELETE', { id: 'passage-1' }));
    expect(res.status).toBe(200);
  });

  it('POST → DB 에러 시 500', async () => {
    const { from } = mockChain({ data: null, error: { message: 'db error' } });
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/passages/route');
    const res = await POST(makeRequest('POST', {
      unit_id: 'unit-1',
      title: 'Test',
      original_text: 'Hello',
      korean_translation: '안녕',
    }));
    expect(res.status).toBe(500);
  });

  it('POST → 유효성 검증 실패 (title 없음) → 400', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/naesin/passages/route');
    const res = await POST(makeRequest('POST', {
      unit_id: 'unit-1',
      original_text: 'Hello',
      korean_translation: '안녕',
    }));
    expect(res.status).toBe(400);
  });
});
