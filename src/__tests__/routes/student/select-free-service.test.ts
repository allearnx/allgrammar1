import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testStudent, testTeacher } from '../../helpers/fixtures';
import { createMockRequest } from '../../helpers/api-test-utils';

const mockGetUser = vi.fn();
const mockCreateClient = vi.fn();
const mockCreateAdminClient = vi.fn();

vi.mock('@/lib/auth/helpers', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}));
vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimit: () => null,
}));
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: any[]) => any) => fn,
  revalidateTag: vi.fn(),
}));

function mockChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const k of ['select', 'insert', 'delete', 'eq', 'in', 'is', 'order', 'limit']) {
    chain[k] = vi.fn(() => chain);
  }
  chain.single = vi.fn().mockResolvedValue(result);
  chain.then = vi.fn((resolve: (v: unknown) => void) => resolve(result));
  return chain;
}

// RLS client: subscriptions 조회만. admin client: service_assignments 조회·삭제·삽입.
function setup({ tier = 'free', existing = [] as unknown[] } = {}) {
  const subChain = mockChain({ data: tier ? { tier } : null, error: null });
  const userClient = { from: vi.fn(() => subChain) };
  const readChain = mockChain({ data: existing, error: null });
  const deleteChain = mockChain({ data: null, error: null });
  const insertChain = mockChain({ data: null, error: null });
  readChain.delete = vi.fn(() => deleteChain);
  readChain.insert = vi.fn(() => insertChain);
  const admin = { from: vi.fn(() => readChain) };
  mockCreateClient.mockResolvedValue(userClient);
  mockCreateAdminClient.mockReturnValue(admin);
  return { userClient, admin, readChain, deleteChain };
}

const makeRequest = (body: unknown) =>
  createMockRequest('POST', body, 'http://localhost/api/student/select-free-service');

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('student/select-free-service', () => {
  it('무료 학원 학생 → admin client로 manual·만료 없음 배정 삽입', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    const { userClient, readChain } = setup();
    const { POST } = await import('@/app/api/student/select-free-service/route');
    const res = await POST(makeRequest({ service: 'naesin' }));

    expect(res.status).toBe(200);
    expect(readChain.insert).toHaveBeenCalledWith({
      student_id: testStudent.id,
      service: 'naesin',
      assigned_by: testStudent.id,
      source: 'manual',
      expires_at: null,
    });
    // RLS client로는 service_assignments를 쓰지 않는다 (학생 INSERT 정책 제거됨)
    expect(userClient.from).not.toHaveBeenCalledWith('service_assignments');
  });

  it('유료 학원 학생 → 403, 쓰기 없음', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    const { admin } = setup({ tier: 'pro' });
    const { POST } = await import('@/app/api/student/select-free-service/route');
    const res = await POST(makeRequest({ service: 'voca' }));

    expect(res.status).toBe(403);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it('학생이 아니면 403', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    const { admin } = setup();
    const { POST } = await import('@/app/api/student/select-free-service/route');
    const res = await POST(makeRequest({ service: 'voca' }));

    expect(res.status).toBe(403);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it('전환 시 본인이 고른 무료 배정만 삭제 — 결제·선생님 배정은 유지', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    const { readChain, deleteChain } = setup({
      existing: [
        { id: 'free', service: 'voca', source: 'manual', assigned_by: testStudent.id, expires_at: null },
        { id: 'paid', service: 'voca', source: 'payment', assigned_by: testStudent.id, expires_at: '2027-01-01' },
        { id: 'teacher', service: 'voca', source: 'manual', assigned_by: 'teacher-1', expires_at: null },
      ],
    });
    const { POST } = await import('@/app/api/student/select-free-service/route');
    const res = await POST(makeRequest({ service: 'naesin' }));

    expect(res.status).toBe(200);
    expect(readChain.delete).toHaveBeenCalled();
    expect(deleteChain.in).toHaveBeenCalledWith('id', ['free']);
    expect(deleteChain.eq).toHaveBeenCalledWith('student_id', testStudent.id);
  });

  it('이미 같은 서비스면 아무것도 쓰지 않음', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    const { readChain } = setup({
      existing: [{ id: 'a', service: 'voca', source: 'manual', assigned_by: testStudent.id, expires_at: null }],
    });
    const { POST } = await import('@/app/api/student/select-free-service/route');
    const res = await POST(makeRequest({ service: 'voca' }));

    expect(res.status).toBe(200);
    expect(readChain.delete).not.toHaveBeenCalled();
    expect(readChain.insert).not.toHaveBeenCalled();
  });
});
