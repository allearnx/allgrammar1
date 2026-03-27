import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testAdmin, testBoss, testStudent } from '../../helpers/fixtures';

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
vi.mock('@/lib/api/audit', () => ({
  auditLog: vi.fn(),
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

function makeRequest(method: string, body?: unknown) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }
  return new NextRequest('http://localhost/api/admin/teachers/teacher-1', { ...init, headers } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('admin/teachers/[id]', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('PATCH → admin이 teacher 비활성화', async () => {
    const { from } = mockChain({
      data: { academy_id: 'academy-1' },
      error: null,
    });
    mockGetUser.mockResolvedValue(testAdmin);
    mockCreateClient.mockResolvedValue({ from });

    const { PATCH } = await import('@/app/api/admin/teachers/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { is_active: false }),
      { params: Promise.resolve({ id: 'teacher-1' }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('PATCH → boss도 teacher 관리 가능', async () => {
    const { from } = mockChain({
      data: { academy_id: 'academy-1' },
      error: null,
    });
    mockGetUser.mockResolvedValue(testBoss);
    mockCreateClient.mockResolvedValue({ from });

    const { PATCH } = await import('@/app/api/admin/teachers/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { is_active: true }),
      { params: Promise.resolve({ id: 'teacher-1' }) }
    );
    expect(res.status).toBe(200);
  });

  it('PATCH → student 권한 없음 (403)', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { PATCH } = await import('@/app/api/admin/teachers/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { is_active: false }),
      { params: Promise.resolve({ id: 'teacher-1' }) }
    );
    expect(res.status).toBe(403);
  });

  it('PATCH → 존재하지 않는 teacher → 404', async () => {
    const { from } = mockChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(testAdmin);
    mockCreateClient.mockResolvedValue({ from });

    const { PATCH } = await import('@/app/api/admin/teachers/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { is_active: false }),
      { params: Promise.resolve({ id: 'nonexistent' }) }
    );
    expect(res.status).toBe(404);
  });

  it('PATCH → admin이 다른 학원 teacher 접근 → 403', async () => {
    const { from } = mockChain({
      data: { academy_id: 'other-academy' },
      error: null,
    });
    mockGetUser.mockResolvedValue(testAdmin);
    mockCreateClient.mockResolvedValue({ from });

    const { PATCH } = await import('@/app/api/admin/teachers/[id]/route');
    const res = await PATCH(
      makeRequest('PATCH', { is_active: false }),
      { params: Promise.resolve({ id: 'teacher-1' }) }
    );
    expect(res.status).toBe(403);
  });
});
