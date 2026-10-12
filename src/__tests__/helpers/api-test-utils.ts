import { vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { AuthUser } from '@/types/auth';

// ── Request helpers ──

export function createMockRequest(
  method: string,
  body?: unknown,
  url = 'http://localhost/api/test',
  contentType = 'application/json'
) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['content-type'] = contentType;
  }

  return new NextRequest(url, { ...init, headers } as any);
}

// ── User helpers ──

export function createMockUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'user@test.com',
    full_name: 'Test User',
    role: 'student',
    academy_id: 'academy-1',
    ...overrides,
  };
}

// ── Supabase mock ──

export function mockSupabaseChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(result)),
  };

  for (const key of Object.keys(chain)) {
    if (key !== 'single' && key !== 'maybeSingle' && key !== 'then') {
      chain[key].mockReturnValue(chain);
    }
  }

  return { from: vi.fn().mockReturnValue(chain), chain };
}

/**
 * Creates a supabase mock where different tables return different results.
 */
export function mockSupabaseMultiTable(
  tableResults: Record<string, { data: unknown; error: unknown }>
) {
  const chains: Record<string, ReturnType<typeof mockSupabaseChain>['chain']> = {};

  for (const [table, result] of Object.entries(tableResults)) {
    const { chain } = mockSupabaseChain(result);
    chains[table] = chain;
  }

  const defaultChain = mockSupabaseChain({ data: null, error: null }).chain;

  const from = vi.fn((table: string) => chains[table] || defaultChain);
  return { from, chains };
}

// ── Response helpers ──

export async function expectJsonResponse(
  res: Response,
  status: number,
  bodyMatcher?: Record<string, unknown>
) {
  expect(res.status).toBe(status);
  if (bodyMatcher) {
    const body = await res.json();
    for (const [key, value] of Object.entries(bodyMatcher)) {
      expect(body[key]).toEqual(value);
    }
    return body;
  }
  return res.json();
}

// ⚠️ 이 파일에 vi.mock()을 두지 말 것 — 함수 안에 있어도 vitest가 모듈 최상단으로 끌어올려
// 이 헬퍼를 import하는 모든 테스트의 mock을 덮어쓴다 (setupMocks 삭제 사유, 2026-10-12).
