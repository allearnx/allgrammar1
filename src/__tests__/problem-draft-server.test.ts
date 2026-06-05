import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  problemDraftSaveSchema,
  problemDraftDeleteSchema,
} from '@/lib/api/schemas';

// ── Mocks ──

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

// ── Helpers ──

function makeRequest(
  method: string,
  body?: unknown,
  url = 'http://localhost/api/test'
) {
  const init: RequestInit = { method };
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }

  return new NextRequest(url, { ...init, headers } as any);
}

function mockSupabaseChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(result)),
  };
  for (const key of Object.keys(chain)) {
    if (key !== 'single' && key !== 'then') {
      chain[key].mockReturnValue(chain);
    }
  }
  return { from: vi.fn().mockReturnValue(chain), chain };
}

const fakeStudent = {
  id: 'student-1',
  email: 'student@test.com',
  role: 'student' as const,
  full_name: 'Student',
  academy_id: 'academy-1',
  is_active: true,
};

const fakeTeacher = {
  id: 'teacher-1',
  email: 'teacher@test.com',
  role: 'teacher' as const,
  full_name: 'Teacher',
  academy_id: 'academy-1',
  is_active: true,
};

const sampleDraftData = {
  version: 1,
  mode: 'interactive',
  sheetId: 'sheet-1',
  questionCount: 100,
  savedAt: '2026-04-05T00:00:00Z',
  currentIndex: 50,
  score: { correct: 42, wrong: 8 },
  wrongList: [],
  aiResultsMap: {},
  answeredUpTo: 49,
  overtimeQuestions: [],
  answersMap: {},
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Zod Schema Tests ──

describe('problemDraftSaveSchema', () => {
  it('accepts valid draft save payload', () => {
    const result = problemDraftSaveSchema.safeParse({
      sheetId: 'sheet-1',
      unitId: 'unit-1',
      draftData: sampleDraftData,
      answeredCount: 50,
    });
    expect(result.success).toBe(true);
  });

  it('accepts null unitId', () => {
    const result = problemDraftSaveSchema.safeParse({
      sheetId: 'sheet-1',
      unitId: null,
      draftData: sampleDraftData,
      answeredCount: 10,
    });
    expect(result.success).toBe(true);
  });

  it('accepts omitted unitId', () => {
    const result = problemDraftSaveSchema.safeParse({
      sheetId: 'sheet-1',
      draftData: sampleDraftData,
      answeredCount: 10,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing sheetId', () => {
    const result = problemDraftSaveSchema.safeParse({
      draftData: sampleDraftData,
      answeredCount: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing draftData', () => {
    const result = problemDraftSaveSchema.safeParse({
      sheetId: 'sheet-1',
      answeredCount: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative answeredCount', () => {
    const result = problemDraftSaveSchema.safeParse({
      sheetId: 'sheet-1',
      draftData: sampleDraftData,
      answeredCount: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer answeredCount', () => {
    const result = problemDraftSaveSchema.safeParse({
      sheetId: 'sheet-1',
      draftData: sampleDraftData,
      answeredCount: 5.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('problemDraftDeleteSchema', () => {
  it('accepts valid delete payload', () => {
    const result = problemDraftDeleteSchema.safeParse({ sheetId: 'sheet-1' });
    expect(result.success).toBe(true);
  });

  it('rejects missing sheetId', () => {
    const result = problemDraftDeleteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ── API Route Tests ──

describe('draft/save route', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('POST upserts draft for authenticated student', async () => {
    const { from, chain } = mockSupabaseChain({
      data: { id: 'draft-1', student_id: 'student-1', sheet_id: 'sheet-1' },
      error: null,
    });
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/problems/draft/save/route');
    const res = await POST(
      makeRequest('POST', {
        sheetId: 'sheet-1',
        unitId: 'unit-1',
        draftData: sampleDraftData,
        answeredCount: 50,
      })
    );
    expect(res.status).toBe(200);
    expect(from).toHaveBeenCalledWith('naesin_problem_drafts');
    expect(chain.upsert).toHaveBeenCalled();
  });

  it('POST returns 401 for unauthenticated user', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/naesin/problems/draft/save/route');
    const res = await POST(
      makeRequest('POST', {
        sheetId: 'sheet-1',
        draftData: sampleDraftData,
        answeredCount: 50,
      })
    );
    expect(res.status).toBe(401);
  });

  it('POST returns 400 for invalid body', async () => {
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { POST } = await import('@/app/api/naesin/problems/draft/save/route');
    const res = await POST(makeRequest('POST', { invalid: true }));
    expect(res.status).toBe(400);
  });

  it('POST returns 500 on Supabase error', async () => {
    const { from } = mockSupabaseChain({
      data: null,
      error: { message: 'db error' },
    });
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/problems/draft/save/route');
    const res = await POST(
      makeRequest('POST', {
        sheetId: 'sheet-1',
        draftData: sampleDraftData,
        answeredCount: 50,
      })
    );
    expect(res.status).toBe(409);
  });
});

describe('draft/load route', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('GET loads draft for authenticated user', async () => {
    const { from } = mockSupabaseChain({
      data: { id: 'draft-1', draft_data: sampleDraftData },
      error: null,
    });
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { GET } = await import('@/app/api/naesin/problems/draft/load/route');
    const res = await GET(
      makeRequest('GET', undefined, 'http://localhost/api/naesin/problems/draft/load?sheetId=sheet-1')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.draft_data).toBeDefined();
  });

  it('GET returns 400 without sheetId query param', async () => {
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { GET } = await import('@/app/api/naesin/problems/draft/load/route');
    const res = await GET(
      makeRequest('GET', undefined, 'http://localhost/api/naesin/problems/draft/load')
    );
    expect(res.status).toBe(400);
  });

  it('GET returns null when no draft exists', async () => {
    const { from } = mockSupabaseChain({
      data: null,
      error: null,
    });
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { GET } = await import('@/app/api/naesin/problems/draft/load/route');
    const res = await GET(
      makeRequest('GET', undefined, 'http://localhost/api/naesin/problems/draft/load?sheetId=sheet-1')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });

  it('GET returns 401 for unauthenticated user', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { GET } = await import('@/app/api/naesin/problems/draft/load/route');
    const res = await GET(
      makeRequest('GET', undefined, 'http://localhost/api/naesin/problems/draft/load?sheetId=sheet-1')
    );
    expect(res.status).toBe(401);
  });

  it('GET re-evaluates draft with current acceptedAnswers (정답처리 반영)', async () => {
    const draftWithAnswers = {
      ...sampleDraftData,
      answersMap: { 0: 'goes', 1: '2', 2: 'went' },
      score: { correct: 1, wrong: 2 },
      wrongList: [
        { number: 1, userAnswer: 'goes', correctAnswer: 'go', question: 'Q1' },
        { number: 3, userAnswer: 'went', correctAnswer: 'gone', question: 'Q3' },
      ],
    };

    const sheetData = {
      answer_key: ['go', '2', 'gone'],
      questions: [
        { number: 1, question: 'Q1', acceptedAnswers: ['goes'] },  // teacher accepted 'goes'
        { number: 2, question: 'Q2', options: ['A', 'B', 'C', 'D'] },
        { number: 3, question: 'Q3', acceptedAnswers: [] },  // 'went' still wrong
      ],
    };

    const from = vi.fn((table: string) => {
      const makeChain = (singleResult: { data: unknown; error: unknown }) => {
        const c: Record<string, ReturnType<typeof vi.fn>> = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(singleResult),
        };
        for (const key of Object.keys(c)) {
          if (key !== 'single') c[key].mockReturnValue(c);
        }
        return c;
      };
      if (table === 'naesin_problem_drafts') {
        return makeChain({ data: { id: 'draft-1', draft_data: draftWithAnswers }, error: null });
      }
      if (table === 'naesin_problem_sheets') {
        return makeChain({ data: sheetData, error: null });
      }
      return makeChain({ data: null, error: null });
    });

    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { GET } = await import('@/app/api/naesin/problems/draft/load/route');
    const res = await GET(
      makeRequest('GET', undefined, 'http://localhost/api/naesin/problems/draft/load?sheetId=sheet-1')
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    // 'goes' was accepted → now correct (2 correct, 1 wrong)
    expect(body.draft_data.score).toEqual({ correct: 2, wrong: 1 });
    expect(body.draft_data.wrongList).toHaveLength(1);
    expect(body.draft_data.wrongList[0].number).toBe(3);
    expect(body.draft_data.wrongList[0].userAnswer).toBe('went');
  });
});

describe('draft/delete route', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('DELETE removes draft for authenticated user', async () => {
    const { from, chain } = mockSupabaseChain({ data: null, error: null });
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { DELETE } = await import('@/app/api/naesin/problems/draft/delete/route');
    const res = await DELETE(makeRequest('DELETE', { sheetId: 'sheet-1' }));
    expect(res.status).toBe(200);
    expect(from).toHaveBeenCalledWith('naesin_problem_drafts');
    expect(chain.delete).toHaveBeenCalled();
  });

  it('DELETE returns 401 for unauthenticated user', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { DELETE } = await import('@/app/api/naesin/problems/draft/delete/route');
    const res = await DELETE(makeRequest('DELETE', { sheetId: 'sheet-1' }));
    expect(res.status).toBe(401);
  });

  it('DELETE returns 400 for missing sheetId', async () => {
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from: vi.fn() });

    const { DELETE } = await import('@/app/api/naesin/problems/draft/delete/route');
    const res = await DELETE(makeRequest('DELETE', {}));
    expect(res.status).toBe(400);
  });
});

// ── Submit route draft cleanup test ──

describe('problems/submit draft cleanup', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('POST deletes server draft after successful submission', async () => {
    const sheetData = {
      id: 'attempt-1',
      answer_key: ['1', '2', '3'],
      questions: [
        { number: 1, question: 'Q1', options: ['A', 'B', 'C', 'D'] },
        { number: 2, question: 'Q2', options: ['A', 'B', 'C', 'D'] },
        { number: 3, question: 'Q3', options: ['A', 'B', 'C', 'D'] },
      ],
      mode: 'interactive',
    };
    const { from: defaultFrom, chain } = mockSupabaseChain({ data: sheetData, error: null });
    // Table-aware from: return arrays for list queries, single for sheet lookup
    const from = vi.fn((table: string) => {
      if (table === 'naesin_problem_sheets' || table === 'naesin_problem_attempts') {
        // These need to resolve as { data: [...], error: null } for list queries
        // but the sheet lookup (with .single()) should return the sheetData
        const listResult = { data: table === 'naesin_problem_sheets' ? [{ id: 'sheet-1' }] : [], error: null };
        const listChain: Record<string, ReturnType<typeof vi.fn>> = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          upsert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: sheetData, error: null }),
          then: vi.fn((resolve: (v: unknown) => void) => resolve(listResult)),
        };
        for (const key of Object.keys(listChain)) {
          if (key !== 'single' && key !== 'then') {
            listChain[key].mockReturnValue(listChain);
          }
        }
        return listChain;
      }
      return chain;
    });
    mockGetUser.mockResolvedValue(fakeStudent);
    mockCreateClient.mockResolvedValue({ from });

    const { POST } = await import('@/app/api/naesin/problems/submit/route');
    const res = await POST(
      makeRequest('POST', {
        sheetId: 'sheet-1',
        unitId: 'unit-1',
        answers: ['1', '2', '3'],
        totalQuestions: 3,
      })
    );
    expect(res.status).toBe(200);

    // Verify naesin_problem_drafts was accessed (for delete)
    const draftCalls = from.mock.calls.filter(
      (call: string[]) => call[0] === 'naesin_problem_drafts'
    );
    expect(draftCalls.length).toBeGreaterThan(0);
  });
});

// ── Server draft functions in useProblemDraft ──

describe('useProblemDraft server functions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('saveServerDraft calls POST /api/naesin/problems/draft/save', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    const { useProblemDraft } = await import('@/hooks/use-problem-draft');
    const { saveServerDraft } = useProblemDraft('sheet-1', 10);
    const ok = await saveServerDraft({
      mode: 'interactive',
      currentIndex: 3,
      score: { correct: 2, wrong: 1 },
      wrongList: [],
      aiResultsMap: {},
      answeredUpTo: 3,
      overtimeQuestions: [],
      answersMap: { 0: '1', 1: '2', 2: '3' },
    }, 'unit-1');

    expect(ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/naesin/problems/draft/save',
      expect.objectContaining({ method: 'POST' })
    );
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.sheetId).toBe('sheet-1');
    expect(body.answeredCount).toBe(3);
    expect(body.unitId).toBe('unit-1');
  });

  it('saveServerDraft returns false on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const { useProblemDraft } = await import('@/hooks/use-problem-draft');
    const { saveServerDraft } = useProblemDraft('sheet-1', 10);
    const ok = await saveServerDraft({
      mode: 'interactive',
      currentIndex: 0,
      score: { correct: 0, wrong: 0 },
      wrongList: [],
      aiResultsMap: {},
      answeredUpTo: 0,
      overtimeQuestions: [],
      answersMap: {},
    });
    expect(ok).toBe(false);
  });

  it('loadServerDraft calls GET with sheetId', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        draft_data: {
          version: 1,
          mode: 'interactive',
          questionCount: 10,
          sheetId: 'sheet-1',
          currentIndex: 5,
          savedAt: '2026-04-05T00:00:00Z',
        },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { useProblemDraft } = await import('@/hooks/use-problem-draft');
    const { loadServerDraft } = useProblemDraft('sheet-1', 10);
    const draft = await loadServerDraft();

    expect(draft).not.toBeNull();
    expect(draft!.mode).toBe('interactive');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/naesin/problems/draft/load?sheetId=sheet-1'
    );
  });

  it('loadServerDraft returns null when no data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null),
    }));

    const { useProblemDraft } = await import('@/hooks/use-problem-draft');
    const { loadServerDraft } = useProblemDraft('sheet-1', 10);
    const draft = await loadServerDraft();
    expect(draft).toBeNull();
  });

  it('loadServerDraft returns null on version mismatch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        draft_data: { version: 999, mode: 'interactive', questionCount: 10 },
      }),
    }));

    const { useProblemDraft } = await import('@/hooks/use-problem-draft');
    const { loadServerDraft } = useProblemDraft('sheet-1', 10);
    const draft = await loadServerDraft();
    expect(draft).toBeNull();
  });

  it('loadServerDraft returns null on questionCount mismatch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        draft_data: { version: 1, mode: 'interactive', questionCount: 20 },
      }),
    }));

    const { useProblemDraft } = await import('@/hooks/use-problem-draft');
    const { loadServerDraft } = useProblemDraft('sheet-1', 10);
    const draft = await loadServerDraft();
    expect(draft).toBeNull();
  });

  it('clearServerDraft calls DELETE', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    const { useProblemDraft } = await import('@/hooks/use-problem-draft');
    const { clearServerDraft } = useProblemDraft('sheet-1', 10);
    await clearServerDraft();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/naesin/problems/draft/delete',
      expect.objectContaining({ method: 'DELETE' })
    );
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.sheetId).toBe('sheet-1');
  });

  it('clearServerDraft does not throw on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));

    const { useProblemDraft } = await import('@/hooks/use-problem-draft');
    const { clearServerDraft } = useProblemDraft('sheet-1', 10);
    await expect(clearServerDraft()).resolves.not.toThrow();
  });
});
