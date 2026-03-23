import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testTeacher, testStudent } from '../../helpers/fixtures';

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
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock Anthropic — messages.create
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

function mockChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
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
  return new NextRequest('http://localhost/api/voca/vocabulary/enrich-round2', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function aiResponse(data: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('voca/vocabulary/enrich-round2', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('단어에 유의어/반의어/숙어 생성 후 DB 업데이트', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    const { from, chain } = mockChain({ data: null, error: null });
    mockCreateClient.mockResolvedValue({ from });

    mockCreate.mockResolvedValue(aiResponse([
      { id: 'v1', s: 'glad, cheerful', a: 'sad', e: 'I am happy.', i: [{ en: 'happy hour', ko: '할인 시간', example_en: 'Let\'s go.', example_ko: '가자.' }] },
      { id: 'v2', s: 'sprint', a: 'walk', e: 'I like to run.', i: null },
    ]));

    const { POST } = await import('@/app/api/voca/vocabulary/enrich-round2/route');
    const res = await POST(makeRequest({
      items: [
        { id: 'v1', front_text: 'happy', back_text: '행복한', part_of_speech: 'adj.' },
        { id: 'v2', front_text: 'run', back_text: '달리다', part_of_speech: 'v.' },
      ],
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(2);

    expect(from).toHaveBeenCalledWith('voca_vocabulary');
    expect(chain.update).toHaveBeenCalledTimes(2);
    expect(chain.update).toHaveBeenCalledWith({
      synonyms: 'glad, cheerful',
      antonyms: 'sad',
      example_sentence: 'I am happy.',
      idioms: [{ en: 'happy hour', ko: '할인 시간', example_en: 'Let\'s go.', example_ko: '가자.' }],
      spelling_answer: 'happy',
      spelling_hint: '행복한',
    });
    expect(chain.update).toHaveBeenCalledWith({
      synonyms: 'sprint',
      antonyms: 'walk',
      example_sentence: 'I like to run.',
      idioms: null,
      spelling_answer: 'run',
      spelling_hint: '달리다',
    });
  });

  it('학생 권한 거부 (403)', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/voca/vocabulary/enrich-round2/route');
    const res = await POST(makeRequest({ items: [{ id: 'v1', front_text: 'test', back_text: '테스트', part_of_speech: null }] }));
    expect(res.status).toBe(403);
  });

  it('빈 목록 → 400', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/voca/vocabulary/enrich-round2/route');
    const res = await POST(makeRequest({ items: [] }));
    expect(res.status).toBe(400);
  });

  it('DB 에러 시 updated 카운트 감소', async () => {
    mockGetUser.mockResolvedValue(testTeacher);

    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };
    let callCount = 0;
    chain.eq.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? { error: null } : { error: { message: 'fail' } });
    });
    const from = vi.fn().mockReturnValue(chain);
    mockCreateClient.mockResolvedValue({ from });

    mockCreate.mockResolvedValue(aiResponse([
      { id: 'v1', s: 'a', a: 'b', i: null },
      { id: 'v2', s: 'c', a: 'd', i: null },
    ]));

    const { POST } = await import('@/app/api/voca/vocabulary/enrich-round2/route');
    const res = await POST(makeRequest({
      items: [
        { id: 'v1', front_text: 'word1', back_text: '뜻1', part_of_speech: null },
        { id: 'v2', front_text: 'word2', back_text: '뜻2', part_of_speech: null },
      ],
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(1);
  });

  it('20개 초과 시 청크 분할 처리', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    const { from } = mockChain({ data: null, error: null });
    mockCreateClient.mockResolvedValue({ from });

    const items = Array.from({ length: 25 }, (_, i) => ({
      id: `v${i}`, front_text: `word${i}`, back_text: `뜻${i}`, part_of_speech: null,
    }));

    mockCreate.mockResolvedValue(aiResponse(
      items.map((item) => ({ id: item.id, s: 'syn', a: 'ant', i: null })),
    ));

    const { POST } = await import('@/app/api/voca/vocabulary/enrich-round2/route');
    const res = await POST(makeRequest({ items }));

    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
