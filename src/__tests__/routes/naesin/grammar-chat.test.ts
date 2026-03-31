import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testStudent } from '../../helpers/fixtures';

const mockGetUser = vi.fn();
const mockCreateClient = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock('@/lib/auth/helpers', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockAdminFrom }),
}));
vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimit: () => null,
}));
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify([
              { question_text: 'Auto Q1', grammar_concept: 'Test', hint: 'hint', expected_answer_keywords: ['key'] },
              { question_text: 'Auto Q2', grammar_concept: 'Test', hint: 'hint', expected_answer_keywords: ['key'] },
              { question_text: 'Auto Q3', grammar_concept: 'Test', hint: 'hint', expected_answer_keywords: ['key'] },
              { question_text: 'Auto Q4', grammar_concept: 'Test', hint: 'hint', expected_answer_keywords: ['key'] },
              { question_text: 'Auto Q5', grammar_concept: 'Test', hint: 'hint', expected_answer_keywords: ['key'] },
            ]),
          }],
        }),
      };
    },
  };
});

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
    expect(body.id).toBe('session-new');
    expect(chain.update).toHaveBeenCalled();
  });

  it('질문 없는 레슨 → AI 자동 생성 후 세션 시작', async () => {
    const generatedQuestions = [
      { id: 'auto-q-1', question_text: 'Auto Q1', sort_order: 0 },
    ];
    const newSession = {
      id: 'session-auto',
      student_id: 'student-1',
      lesson_id: 'lesson-empty',
      messages: [{ role: 'ai', content: 'Auto Q1', questionId: 'auto-q-1' }],
      turn_count: 0,
    };

    // Track questions query count to return different results
    let questionsQueryCount = 0;

    const sessionChain = buildChain();
    const questionsChain = buildChain({
      then: vi.fn((resolve: (v: unknown) => void) => {
        questionsQueryCount++;
        if (questionsQueryCount === 1) {
          resolve({ data: [], error: null });
        } else {
          resolve({ data: generatedQuestions, error: null });
        }
      }),
    });
    const lessonChain = buildChain({
      single: vi.fn().mockResolvedValue({ data: { title: 'Present Tense', text_content: 'Content here' }, error: null }),
    });
    const sessionInsertChain = buildChain({
      single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
    });

    // Track session from() calls to return insert chain on second call
    let sessionFromCount = 0;
    const from = vi.fn((table: string) => {
      if (table === 'naesin_grammar_chat_questions') return questionsChain;
      if (table === 'naesin_grammar_lessons') return lessonChain;
      // naesin_grammar_chat_sessions
      sessionFromCount++;
      return sessionFromCount === 1 ? sessionChain : sessionInsertChain;
    });

    // Admin client mock for insert
    const adminChain = buildChain();
    mockAdminFrom.mockReturnValue(adminChain);

    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/grammar/chat/start/route');
    const res = await POST(makeRequest({ lessonId: 'lesson-empty' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('session-auto');
    // Admin client should have been called to insert generated questions
    expect(mockAdminFrom).toHaveBeenCalledWith('naesin_grammar_chat_questions');
  });

  it('미인증 → 401', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/naesin/grammar/chat/start/route');
    const res = await POST(makeRequest({ lessonId: 'lesson-1' }));
    expect(res.status).toBe(401);
  });
});
