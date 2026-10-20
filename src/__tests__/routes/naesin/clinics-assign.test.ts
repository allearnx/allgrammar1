import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testTeacher, testBoss } from '../../helpers/fixtures';
import { createMockRequest } from '../../helpers/api-test-utils';

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
vi.mock('@/lib/api/require-content-permission', () => ({
  requireContentPermission: vi.fn().mockResolvedValue(undefined),
}));

const TEMPLATE = '00000000-0000-4000-8000-000000000001';
const OWN = '00000000-0000-4000-8000-0000000000a1';
const OTHER = '00000000-0000-4000-8000-0000000000b2';

/** 테이블별 결과를 돌려주는 체인 mock — users 조회는 같은 학원 학생(OWN)만 돌려줌 */
function mockSupabase() {
  const inserted: unknown[] = [];
  const from = vi.fn((table: string) => {
    const result = () => {
      if (table === 'users') return { data: [{ id: OWN }], error: null };
      if (table === 'naesin_templates') return { data: { id: TEMPLATE, title: 't', mode: 'normal', questions: [], answer_key: [] }, error: null };
      if (table === 'naesin_problem_sheets') return { data: [], error: null };
      return { data: [], error: null };
    };
    const chain: Record<string, unknown> = {};
    for (const k of ['select', 'eq', 'in', 'not', 'order']) chain[k] = vi.fn(() => chain);
    chain.insert = vi.fn((rows: unknown[]) => {
      inserted.push(...rows);
      return { select: () => Promise.resolve({ data: rows.map((_, i) => ({ id: `s${i}`, assigned_student_id: OWN })), error: null }) };
    });
    chain.single = vi.fn(() => Promise.resolve(result()));
    chain.then = (resolve: (v: unknown) => void) => resolve(result());
    return chain;
  });
  return { from, inserted };
}

const makeRequest = (body: unknown) => createMockRequest('POST', body, 'http://localhost/api/naesin/clinics/assign');

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('naesin/clinics/assign 학원 범위', () => {
  it('선생님이 다른 학원 학생을 섞으면 403, 아무것도 만들지 않음', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    const sb = mockSupabase();
    mockCreateClient.mockResolvedValue(sb);

    const { POST } = await import('@/app/api/naesin/clinics/assign/route');
    const res = await POST(makeRequest({ templateId: TEMPLATE, studentIds: [OWN, OTHER] }));
    expect(res.status).toBe(403);
    expect(sb.inserted).toHaveLength(0);
  });

  it('선생님이 같은 학원 학생에게만 배정하면 통과', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    const sb = mockSupabase();
    mockCreateClient.mockResolvedValue(sb);

    const { POST } = await import('@/app/api/naesin/clinics/assign/route');
    const res = await POST(makeRequest({ templateId: TEMPLATE, studentIds: [OWN] }));
    expect(res.status).toBe(200);
    expect(sb.inserted).toHaveLength(1);
  });

  it('학원 없는 선생님은 403', async () => {
    mockGetUser.mockResolvedValue({ ...testTeacher, academy_id: null });
    mockCreateClient.mockResolvedValue(mockSupabase());

    const { POST } = await import('@/app/api/naesin/clinics/assign/route');
    const res = await POST(makeRequest({ templateId: TEMPLATE, studentIds: [OWN] }));
    expect(res.status).toBe(403);
  });

  it('boss는 학원 검사 없이 배정', async () => {
    mockGetUser.mockResolvedValue(testBoss);
    const sb = mockSupabase();
    mockCreateClient.mockResolvedValue(sb);

    const { POST } = await import('@/app/api/naesin/clinics/assign/route');
    const res = await POST(makeRequest({ templateId: TEMPLATE, studentIds: [OWN, OTHER] }));
    expect(res.status).toBe(200);
    expect(sb.from).not.toHaveBeenCalledWith('users');
  });
});
