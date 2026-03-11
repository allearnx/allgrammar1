import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// --- Upstash Redis (환경변수 있을 때만) ---

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(max: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${max}:${windowMs}`;
  let limiter = limiterCache.get(key);
  if (!limiter) {
    const seconds = Math.max(1, Math.round(windowMs / 1000));
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${seconds} s`),
      prefix: 'rl',
    });
    limiterCache.set(key, limiter);
  }
  return limiter;
}

// --- 인메모리 폴백 (Vercel 서버리스 인스턴스별) ---

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

const CLEANUP_INTERVAL = 10 * 60 * 1000;
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

function checkRateLimitInMemory(
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number
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

// --- 통합 인터페이스 (Upstash 우선, 인메모리 폴백) ---

/**
 * Rate limiter: Upstash Redis가 설정되어 있으면 분산 제한,
 * 없으면 인메모리 폴백 (인스턴스별 제한).
 *
 * @returns null이면 통과, NextResponse면 429 응답 반환
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number = 60 * 60 * 1000
): Promise<NextResponse | null> {
  const limiter = getUpstashLimiter(maxRequests, windowMs);
  if (limiter) {
    const { success } = await limiter.limit(`${endpoint}:${userId}`);
    if (!success) {
      return NextResponse.json(
        { error: '시간당 요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }
    return null;
  }

  return checkRateLimitInMemory(userId, endpoint, maxRequests, windowMs);
}
