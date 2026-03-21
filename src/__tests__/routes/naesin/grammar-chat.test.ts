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

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/naesin/grammar/chat/start', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('naesin/grammar/chat/start', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  function buildChain(overrides: Record<string, ReturnType<typeof vi.fn>> = {}) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null })),
      ...overrides,
    };
    for (const key of Object.keys(chain)) {
      if (!['maybeSingle', 'single', 'then'].includes(key)) chain[key].mockReturnValue(chain);
    }
    return chain;
  }

  it('새 세션 생성 (질문 존재)', async () => {
    const questions = [
      { id: 'q-1', question_text: 'What is present tense?', sort_order: 0 },
    ];
    const newSession = {
      id: 'session-1',
      student_id: 'student-1',
      lesson_id: 'lesson-1',
      messages: [{ role: 'ai', content: 'What is present tense?', questionId: 'q-1' }],
      turn_count: 0,
    };

    const chain = buildChain({
      single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: questions, error: null })),
    });

    const from = vi.fn().mockReturnValue(chain);
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/grammar/chat/start/route');
    const res = await POST(makeRequest({ lessonId: 'lesson-1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('session-1');
  });

  it('기존 미완료 세션 닫고 새 세션 생성', async () => {
    const questions = [
      { id: 'q-1', question_text: 'What is present tense?', sort_order: 0 },
    ];
    const newSession = {
      id: 'session-new',
      student_id: 'student-1',
      lesson_id: 'lesson-1',
      messages: [{ role: 'ai', content: 'What is present tense?', questionId: 'q-1' }],
      turn_count: 0,
    };

    const chain = buildChain({
      single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: questions, error: null })),
    });

    const from = vi.fn().mockReturnValue(chain);
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/grammar/chat/start/route');
    const res = await POST(makeRequest({ lessonId: 'lesson-1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    // Should create a new session, not return existing
    expect(body.id).toBe('session-new');
    // Should have called update to close existing sessions
    expect(chain.update).toHaveBeenCalled();
  });

  it('질문 없는 레슨 → 404', async () => {
    const chain = buildChain({
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null })),
    });

    const from = vi.fn().mockReturnValue(chain);
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/grammar/chat/start/route');
    const res = await POST(makeRequest({ lessonId: 'lesson-empty' }));
    expect(res.status).toBe(404);
  });

  it('미인증 → 401', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/naesin/grammar/chat/start/route');
    const res = await POST(makeRequest({ lessonId: 'lesson-1' }));
    expect(res.status).toBe(401);
  });
});
