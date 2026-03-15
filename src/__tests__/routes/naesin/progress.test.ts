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
  return new NextRequest('http://localhost/api/naesin/vocab/progress', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('naesin/vocab/progress', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('flashcard 진도 저장', async () => {
    const { from } = mockChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/vocab/progress/route');
    const res = await POST(makeRequest({
      unitId: 'unit-1',
      type: 'flashcard',
      totalItems: 10,
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('quiz 점수 저장 → vocabCompleted false (spelling 부족)', async () => {
    const { from } = mockChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/vocab/progress/route');
    const res = await POST(makeRequest({
      unitId: 'unit-1',
      type: 'quiz',
      score: 90,
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vocabCompleted).toBe(false);
  });

  it('quiz+spelling 모두 80 이상 → vocabCompleted true', async () => {
    // Mock existing progress with spelling 85
    const { from } = mockChain({
      data: { vocab_quiz_score: 0, vocab_spelling_score: 85 },
      error: null,
    });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/vocab/progress/route');
    const res = await POST(makeRequest({
      unitId: 'unit-1',
      type: 'quiz',
      score: 80,
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vocabCompleted).toBe(true);
  });

  it('유효하지 않은 type → 400', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/naesin/vocab/progress/route');
    const res = await POST(makeRequest({
      unitId: 'unit-1',
      type: 'invalid',
      score: 50,
    }));
    expect(res.status).toBe(400);
  });
});

describe('naesin/grammar/progress', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('video 완료 저장', async () => {
    const { from } = mockChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/grammar/progress/route');
    const res = await POST(makeRequest({
      unitId: 'unit-1',
      type: 'video',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.grammarCompleted).toBe(true);
  });

  it('text 읽기 완료 저장', async () => {
    const { from } = mockChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/grammar/progress/route');
    const res = await POST(makeRequest({
      unitId: 'unit-1',
      type: 'text',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.grammarCompleted).toBe(true);
  });
});

describe('naesin/passage/progress', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('fill_blanks 진도 저장', async () => {
    // Need multi-table: passage_attempts (insert) + student_progress (select, upsert) + student_settings (select)
    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: null, error: null })),
    };
    for (const key of Object.keys(chain)) {
      if (key !== 'single' && key !== 'then') chain[key].mockReturnValue(chain);
    }

    const from = vi.fn().mockReturnValue(chain);
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/passage/progress/route');
    const res = await POST(new NextRequest('http://localhost/api/naesin/passage/progress', {
      method: 'POST',
      body: JSON.stringify({ unitId: 'unit-1', type: 'fill_blanks', score: 90 }),
      headers: { 'content-type': 'application/json' },
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
