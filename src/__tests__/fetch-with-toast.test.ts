import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { fetchWithToast } from '@/lib/fetch-with-toast';

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as unknown as Response;
}

/** 마지막 fetch 호출의 RequestInit */
function lastInit(mockFetch: ReturnType<typeof vi.fn>): RequestInit {
  const calls = mockFetch.mock.calls;
  return calls[calls.length - 1][1] as RequestInit;
}

describe('fetchWithToast — keepalive 기본 적용', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('작은 JSON 본문에는 keepalive: true를 붙인다 (페이지 언로드에도 저장 도달)', async () => {
    await fetchWithToast('/api/naesin/dialogue/progress', {
      body: { unitId: 'u1', score: 90, round: '1', type: 'translation' },
    });
    const init = lastInit(mockFetch);
    expect(init.keepalive).toBe(true);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ unitId: 'u1', score: 90, round: '1', type: 'translation' }));
  });

  it('본문이 32KB(바이트)를 넘으면 keepalive를 붙이지 않는다 — 한글은 바이트로 잰다', async () => {
    // 한글 1자 = 3바이트. 12,000자 ≈ 36KB > 32KB (문자 수 12,000은 32,768 미만이라
    // 문자 수로 재면 잘못 통과하므로, 바이트 측정을 검증하는 케이스)
    const big = '가'.repeat(12_000);
    await fetchWithToast('/api/naesin/wrong-answers', { body: { wrongAnswers: big } });
    expect(lastInit(mockFetch).keepalive).toBeUndefined();
  });

  it('FormData 본문에는 keepalive를 붙이지 않는다', async () => {
    const fd = new FormData();
    fd.append('name', 'x');
    await fetchWithToast('/api/materials', { body: fd });
    const init = lastInit(mockFetch);
    expect(init.keepalive).toBeUndefined();
    expect(init.body).toBe(fd);
  });

  it('본문 없는 요청(GET)에는 keepalive를 붙이지 않는다', async () => {
    await fetchWithToast('/api/naesin/vocab-quiz-sets?unitId=u1', { method: 'GET' });
    const init = lastInit(mockFetch);
    expect(init.keepalive).toBeUndefined();
    expect(init.body).toBeUndefined();
  });

  it('호출자가 fetchOptions.keepalive를 명시하면 그 값이 우선한다', async () => {
    await fetchWithToast('/api/x', { body: { a: 1 }, fetchOptions: { keepalive: false } });
    expect(lastInit(mockFetch).keepalive).toBe(false);
  });

  it('fetchOptions.signal은 keepalive와 함께 보존된다', async () => {
    const controller = new AbortController();
    await fetchWithToast('/api/x', { body: { a: 1 }, fetchOptions: { signal: controller.signal } });
    const init = lastInit(mockFetch);
    expect(init.keepalive).toBe(true);
    expect(init.signal).toBe(controller.signal);
  });
});

describe('fetchWithToast — 기존 동작 유지', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('204는 undefined를 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 } as Response));
    await expect(fetchWithToast('/api/x', { body: { a: 1 } })).resolves.toBeUndefined();
  });

  it('4xx는 서버 메시지로 throw하고 재시도하지 않는다', async () => {
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse({ error: '입력값이 올바르지 않습니다.' }, 400));
    vi.stubGlobal('fetch', mockFetch);
    await expect(fetchWithToast('/api/x', { body: { a: 1 }, retry: 2 })).rejects.toThrow('입력값이 올바르지 않습니다.');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('네트워크 오류(TypeError)는 retry 횟수만큼 재시도한다', async () => {
    vi.useFakeTimers();
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse({ saved: true }));
    vi.stubGlobal('fetch', mockFetch);

    const p = fetchWithToast<{ saved: boolean }>('/api/x', { body: { a: 1 }, retry: 1 });
    await vi.runAllTimersAsync(); // 1초 backoff 소진
    await expect(p).resolves.toEqual({ saved: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // 재시도 요청도 keepalive를 유지한다
    expect(lastInit(mockFetch).keepalive).toBe(true);
  });
});
