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

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/voca/progress', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('voca/progress', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('flashcard 진도 저장 (round 1)', async () => {
    const { from } = mockChain({
      data: { student_id: 'student-1', day_id: 'day-1', flashcard_completed: true },
      error: null,
    });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/voca/progress/route');
    const res = await POST(makeRequest({
      dayId: 'day-1',
      type: 'flashcard',
      round: '1',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('quiz 점수 저장 (round 2)', async () => {
    const { from } = mockChain({
      data: { student_id: 'student-1', day_id: 'day-1', round2_quiz_score: 85 },
      error: null,
    });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/voca/progress/route');
    const res = await POST(makeRequest({
      dayId: 'day-1',
      type: 'quiz',
      score: 85,
      round: '2',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('matching 90+ → matching_completed true', async () => {
    const { from } = mockChain({
      data: { matching_completed: true, matching_score: 95 },
      error: null,
    });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/voca/progress/route');
    const res = await POST(makeRequest({
      dayId: 'day-1',
      type: 'matching',
      score: 95,
      matchingAttempt: 1,
    }));
    expect(res.status).toBe(200);
  });

  it('spelling 저장', async () => {
    const { from } = mockChain({
      data: { spelling_score: 70 },
      error: null,
    });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/voca/progress/route');
    const res = await POST(makeRequest({
      dayId: 'day-1',
      type: 'spelling',
      score: 70,
    }));
    expect(res.status).toBe(200);
  });

  it('DB 에러 → 400', async () => {
    const { from } = mockChain({ data: null, error: { message: 'constraint error' } });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/voca/progress/route');
    const res = await POST(makeRequest({
      dayId: 'day-1',
      type: 'flashcard',
    }));
    expect(res.status).toBe(400);
  });

  it('유효하지 않은 type → 400', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/voca/progress/route');
    const res = await POST(makeRequest({
      dayId: 'day-1',
      type: 'invalid_type',
    }));
    expect(res.status).toBe(400);
  });
});
