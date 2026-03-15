import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testStudent } from '../../helpers/fixtures';

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
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(result)),
  };
  for (const key of Object.keys(chain)) {
    if (key !== 'single' && key !== 'then') chain[key].mockReturnValue(chain);
  }
  return { from: vi.fn().mockReturnValue(chain), chain };
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/voca/quiz-result', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('voca/quiz-result', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('퀴즈 결과 저장 (첫 시도)', async () => {
    const { from } = mockChain({
      data: { id: 'qr-1', attempt_number: 1, score: 80 },
      error: null,
    });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/voca/quiz-result/route');
    const res = await POST(makeRequest({
      unitId: 'day-1',
      score: 80,
      totalQuestions: 10,
      correctCount: 8,
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.attempt_number).toBe(1);
  });

  it('퀴즈 결과 저장 (오답 단어 포함)', async () => {
    const { from } = mockChain({
      data: { id: 'qr-2', attempt_number: 2, score: 60, wrong_words: [{ word: 'apple' }] },
      error: null,
    });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/voca/quiz-result/route');
    const res = await POST(makeRequest({
      unitId: 'day-1',
      score: 60,
      totalQuestions: 10,
      correctCount: 6,
      wrongWords: [{ word: 'apple' }],
    }));
    expect(res.status).toBe(200);
  });

  it('유효성 검증 실패 (score 없음) → 400', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/voca/quiz-result/route');
    const res = await POST(makeRequest({
      unitId: 'day-1',
      totalQuestions: 10,
    }));
    expect(res.status).toBe(400);
  });

  it('DB 에러 → 500', async () => {
    const { from } = mockChain({ data: null, error: { message: 'db error' } });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/voca/quiz-result/route');
    const res = await POST(makeRequest({
      unitId: 'day-1',
      score: 80,
      totalQuestions: 10,
    }));
    expect(res.status).toBe(500);
  });
});
