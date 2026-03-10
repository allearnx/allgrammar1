import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10분마다 만료 엔트리 정리
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const store of stores.values()) {
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }
}

/**
 * 인메모리 rate limiter.
 * Vercel 서버리스에서는 인스턴스별이라 완벽하지 않지만,
 * 단일 인스턴스 내 과다 호출은 방지됨.
 *
 * @returns null이면 통과, NextResponse면 429 응답 반환
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number = 60 * 60 * 1000
): NextResponse | null {
  cleanup();

  if (!stores.has(endpoint)) {
    stores.set(endpoint, new Map());
  }
  const store = stores.get(endpoint)!;

  const now = Date.now();
  const entry = store.get(userId);

  if (entry) {
    if (now < entry.resetAt) {
      if (entry.count >= maxRequests) {
        return NextResponse.json(
          { error: '시간당 요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        );
      }
      entry.count++;
    } else {
      store.set(userId, { count: 1, resetAt: now + windowMs });
    }
  } else {
    store.set(userId, { count: 1, resetAt: now + windowMs });
  }

  return null;
}
