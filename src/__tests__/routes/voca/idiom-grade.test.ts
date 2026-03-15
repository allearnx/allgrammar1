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
  return new NextRequest('http://localhost/api/voca/idiom-grade', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateClient.mockResolvedValue({ from: vi.fn() });
});

describe('voca/idiom-grade', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exact match → AI 호출 없이 정답 반환', async () => {
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: vi.fn() };
      },
    }));

    mockGetUser.mockResolvedValue(testStudent);

    const { POST } = await import('@/app/api/voca/idiom-grade/route');
    const res = await POST(makeRequest({
      questions: [{
        type: 'idiom_en_to_ko',
        prompt: 'break the ice',
        reference: '분위기를 깨다',
        studentAnswer: '분위기를 깨다',
      }],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].score).toBe(100);
    expect(body.results[0].feedback).toBe('정답!');
  });

  it('exact match (대소문자 무시)', async () => {
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: vi.fn() };
      },
    }));

    mockGetUser.mockResolvedValue(testStudent);

    const { POST } = await import('@/app/api/voca/idiom-grade/route');
    const res = await POST(makeRequest({
      questions: [{
        type: 'idiom_ko_to_en',
        prompt: '분위기를 깨다',
        reference: 'Break the ice',
        studentAnswer: 'break the ice',
      }],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].score).toBe(100);
  });

  it('AI 채점 fallback (부분 정답)', async () => {
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = {
          create: vi.fn().mockResolvedValue({
            content: [{ type: 'text', text: '[{"index": 1, "score": 50, "feedback": "부분 정답"}]' }],
          }),
        };
      },
    }));

    mockGetUser.mockResolvedValue(testStudent);

    const { POST } = await import('@/app/api/voca/idiom-grade/route');
    const res = await POST(makeRequest({
      questions: [{
        type: 'idiom_en_to_ko',
        prompt: 'break the ice',
        reference: '분위기를 깨다',
        studentAnswer: '얼음을 깨다',
      }],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0].score).toBe(50);
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

    const { POST } = await import('@/app/api/voca/idiom-grade/route');
    const res = await POST(makeRequest({
      questions: [{
        type: 'idiom_en_to_ko',
        prompt: 'break the ice',
        reference: '분위기를 깨다',
        studentAnswer: '잘 모르겠어요',
      }],
    }));
    expect(res.status).toBe(500);
  });

  it('빈 questions → 400', async () => {
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class MockAnthropic {
        messages = { create: vi.fn() };
      },
    }));

    mockGetUser.mockResolvedValue(testStudent);

    const { POST } = await import('@/app/api/voca/idiom-grade/route');
    const res = await POST(makeRequest({ questions: [] }));
    expect(res.status).toBe(400);
  });
});
