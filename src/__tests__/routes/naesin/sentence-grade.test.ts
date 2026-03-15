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
  return new NextRequest('http://localhost/api/naesin/passage/grade-translation', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateClient.mockResolvedValue({ from: vi.fn() });
});

describe('naesin/passage/grade-translation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exact match → AI 호출 없이 정답', async () => {
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: vi.fn() };
      },
    }));

    mockGetUser.mockResolvedValue(testStudent);

    const { POST } = await import('@/app/api/naesin/passage/grade-translation/route');
    const res = await POST(makeRequest({
      sentences: [{
        koreanText: '나는 사과를 좋아한다.',
        originalText: 'I like apples.',
        studentAnswer: 'I like apples.',
      }],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].score).toBe(100);
    expect(body.results[0].feedback).toBe('정답!');
  });

  it('acceptedAnswers에 포함된 답 → 정답', async () => {
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: vi.fn() };
      },
    }));

    mockGetUser.mockResolvedValue(testStudent);

    const { POST } = await import('@/app/api/naesin/passage/grade-translation/route');
    const res = await POST(makeRequest({
      sentences: [{
        koreanText: '나는 사과를 좋아한다.',
        originalText: 'I like apples.',
        studentAnswer: 'I love apples.',
        acceptedAnswers: ['I love apples.'],
      }],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].score).toBe(100);
  });

  it('AI 채점 fallback', async () => {
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = {
          create: vi.fn().mockResolvedValue({
            content: [{ type: 'text', text: '[{"index": 1, "score": 0, "feedback": "오답"}]' }],
          }),
        };
      },
    }));

    mockGetUser.mockResolvedValue(testStudent);

    const { POST } = await import('@/app/api/naesin/passage/grade-translation/route');
    const res = await POST(makeRequest({
      sentences: [{
        koreanText: '나는 사과를 좋아한다.',
        originalText: 'I like apples.',
        studentAnswer: 'I eat apples.',
      }],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].score).toBe(0);
  });

  it('AI 에러 → 500', async () => {
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = {
          create: vi.fn().mockRejectedValue(new Error('API error')),
        };
      },
    }));

    mockGetUser.mockResolvedValue(testStudent);

    const { POST } = await import('@/app/api/naesin/passage/grade-translation/route');
    const res = await POST(makeRequest({
      sentences: [{
        koreanText: '나는 사과를 좋아한다.',
        originalText: 'I like apples.',
        studentAnswer: '모르겠어요',
      }],
    }));
    expect(res.status).toBe(500);
  });

  it('빈 sentences → 400', async () => {
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: vi.fn() };
      },
    }));

    mockGetUser.mockResolvedValue(testStudent);

    const { POST } = await import('@/app/api/naesin/passage/grade-translation/route');
    const res = await POST(makeRequest({ sentences: [] }));
    expect(res.status).toBe(400);
  });
});
