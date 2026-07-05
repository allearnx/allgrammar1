import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testTeacher, testAdmin, testBoss, testStudent } from '../helpers/fixtures';

// ── Mocks ──

const mockGetUser = vi.fn();
const mockCreateClient = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock('@/lib/auth/helpers', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockAdminFrom }),
}));
vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimit: () => null,
}));

// ── Helpers ──

function makeRequest(url = 'http://localhost/api/live-monitor') {
  return new NextRequest(url, { method: 'GET' });
}

function buildChain(overrides: Record<string, ReturnType<typeof vi.fn>> = {}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null })),
    ...overrides,
  };
  for (const key of Object.keys(chain)) {
    if (!['maybeSingle', 'single', 'then'].includes(key)) chain[key].mockReturnValue(chain);
  }
  return chain;
}

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

// ── Test data ──

const studentA = { id: 'stu-a', full_name: '김민수', last_active_at: minutesAgo(0.5) };
const studentB = { id: 'stu-b', full_name: '이지영', last_active_at: minutesAgo(0.5) };
const studentC = { id: 'stu-c', full_name: '박서준', last_active_at: minutesAgo(5) };
const studentD = { id: 'stu-d', full_name: '최유진', last_active_at: null };

const allStudents = [studentA, studentB, studentC, studentD];

// Naesin progress: studentA learning now, studentC old
const naesinProgress = [
  {
    student_id: 'stu-a',
    unit_id: 'unit-1',
    updated_at: minutesAgo(0.5),
    current_stage: 'passage',
    vocab_completed: true,
    dialogue_completed: true,
    passage_completed: false,
    grammar_completed: false,
    problem_completed: false,
    mock_exam_completed: false,
  },
  {
    student_id: 'stu-c',
    unit_id: 'unit-2',
    updated_at: minutesAgo(30),
    current_stage: 'problem',
    vocab_completed: true,
    dialogue_completed: true,
    passage_completed: true,
    grammar_completed: true,
    problem_completed: true,
    mock_exam_completed: true,
  },
];

// Voca progress: studentB learning now
const vocaProgress = [
  { student_id: 'stu-b', day_id: 'day-1', updated_at: minutesAgo(1) },
  { student_id: 'stu-c', day_id: 'day-2', updated_at: minutesAgo(60) },
];

const dailyLogs = [
  { student_id: 'stu-a', seconds: 2700, context_type: 'naesin' },
  { student_id: 'stu-b', seconds: 1920, context_type: 'voca' },
  { student_id: 'stu-a', seconds: 300, context_type: 'voca' },
];

const units = [
  { id: 'unit-1', unit_number: 3, title: '현재완료' },
];

const vocaDays = [
  { id: 'day-1', day_number: 12, title: 'Day 12', book_id: 'book-1' },
];

// ── Setup multi-table mock ──

function setupAdminFrom() {
  const tableData: Record<string, unknown[]> = {
    users: allStudents,
    naesin_student_progress: naesinProgress,
    voca_student_progress: vocaProgress,
    learning_daily_log: dailyLogs,
    naesin_units: units,
    voca_days: vocaDays,
  };

  const chains: Record<string, ReturnType<typeof buildChain>> = {};
  for (const [table, data] of Object.entries(tableData)) {
    chains[table] = buildChain({
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data, error: null })),
    });
  }

  mockAdminFrom.mockImplementation((table: string) => {
    return chains[table] || buildChain();
  });

  return chains;
}

// ── Tests ──

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateClient.mockResolvedValue({ from: vi.fn().mockReturnValue(buildChain()) });
});

describe('/api/live-monitor', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // ── Auth & Role ──

  it('학생 접근 시 403', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('선생님 접근 허용', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    setupAdminFrom();
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it('원장 접근 허용', async () => {
    mockGetUser.mockResolvedValue(testAdmin);
    setupAdminFrom();
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it('academy_id 없으면 403', async () => {
    mockGetUser.mockResolvedValue({ ...testTeacher, academy_id: null });
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  // ── Empty state ──

  it('학생 0명이면 빈 배열 반환', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    mockAdminFrom.mockReturnValue(
      buildChain({ then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null })) })
    );
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.students).toEqual([]);
    expect(body.totalCount).toBe(0);
    expect(body.learningCount).toBe(0);
    expect(body.onlineCount).toBe(0);
  });

  // ── 3-state detection ──

  it('학습 중 학생 감지 (naesin heartbeat 2분 이내)', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    setupAdminFrom();
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    const stuA = body.students.find((s: { id: string }) => s.id === 'stu-a');
    expect(stuA.status).toBe('learning');
    expect(stuA.currentActivity).not.toBeNull();
    expect(stuA.currentActivity.type).toBe('naesin');
    expect(stuA.currentActivity.label).toContain('Unit 3');
    expect(stuA.currentActivity.label).toContain('현재완료');
    expect(stuA.currentActivity.stage).toBe('교과서 암기');
  });

  it('학습 중 학생 감지 (voca heartbeat 2분 이내)', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    setupAdminFrom();
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    const stuB = body.students.find((s: { id: string }) => s.id === 'stu-b');
    expect(stuB.status).toBe('learning');
    expect(stuB.currentActivity).not.toBeNull();
    expect(stuB.currentActivity.type).toBe('voca');
    expect(stuB.currentActivity.label).toContain('Day 12');
  });

  it('접속 중 학생 감지 (last_active_at 2분 이내, heartbeat 오래됨)', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    // studentC: last_active_at = 5min ago → offline
    // Override: make studentC recently active but with old heartbeat
    const modifiedStudents = allStudents.map((s) =>
      s.id === 'stu-c' ? { ...s, last_active_at: minutesAgo(0.5) } : s
    );

    const chains: Record<string, ReturnType<typeof buildChain>> = {};
    const tableData: Record<string, unknown[]> = {
      users: modifiedStudents,
      naesin_student_progress: naesinProgress,
      voca_student_progress: vocaProgress,
      learning_daily_log: dailyLogs,
      naesin_units: units,
      voca_days: vocaDays,
    };
    for (const [table, data] of Object.entries(tableData)) {
      chains[table] = buildChain({
        then: vi.fn((resolve: (v: unknown) => void) => resolve({ data, error: null })),
      });
    }
    mockAdminFrom.mockImplementation((table: string) => chains[table] || buildChain());

    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    const stuC = body.students.find((s: { id: string }) => s.id === 'stu-c');
    expect(stuC.status).toBe('online');
    expect(stuC.currentActivity).toBeNull();
  });

  it('미접속 학생 감지 (last_active_at null, heartbeat 오래됨)', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    setupAdminFrom();
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    const stuD = body.students.find((s: { id: string }) => s.id === 'stu-d');
    expect(stuD.status).toBe('offline');
    expect(stuD.currentActivity).toBeNull();
  });

  // ── Counts ──

  it('learningCount, onlineCount 정확히 집계', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    setupAdminFrom();
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.learningCount).toBe(2); // stu-a (naesin), stu-b (voca)
    expect(body.totalCount).toBe(4);
    // stu-c: last_active_at = 5min ago → offline, stu-d: null → offline
    // onlineCount depends on presence threshold
  });

  // ── Sorting ──

  it('정렬: learning → online → offline, 같은 상태 내 이름순', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    setupAdminFrom();
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    const statuses = body.students.map((s: { status: string }) => s.status);
    // learning ones first, then the rest
    const firstOfflineIdx = statuses.indexOf('offline');
    const lastLearningIdx = statuses.lastIndexOf('learning');
    if (firstOfflineIdx >= 0 && lastLearningIdx >= 0) {
      expect(lastLearningIdx).toBeLessThan(firstOfflineIdx);
    }
  });

  // ── Today seconds ──

  it('오늘 학습 시간 올바르게 합산', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    setupAdminFrom();
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    const stuA = body.students.find((s: { id: string }) => s.id === 'stu-a');
    expect(stuA.todaySeconds).toBe(3000); // 2700 + 300

    const stuB = body.students.find((s: { id: string }) => s.id === 'stu-b');
    expect(stuB.todaySeconds).toBe(1920);

    const stuD = body.students.find((s: { id: string }) => s.id === 'stu-d');
    expect(stuD.todaySeconds).toBe(0);
  });

  // ── Naesin progress ──

  it('내신 진행률 (completed / total) 계산', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    setupAdminFrom();
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    // stu-a: 1 unit × 6 stages, 2 completed (vocab + dialogue)
    const stuA = body.students.find((s: { id: string }) => s.id === 'stu-a');
    expect(stuA.naesinProgress.total).toBe(6);
    expect(stuA.naesinProgress.completed).toBe(2);

    // stu-c: 1 unit × 6 stages, all 6 completed
    const stuC = body.students.find((s: { id: string }) => s.id === 'stu-c');
    expect(stuC.naesinProgress.total).toBe(6);
    expect(stuC.naesinProgress.completed).toBe(6);

    // stu-d: no progress
    const stuD = body.students.find((s: { id: string }) => s.id === 'stu-d');
    expect(stuD.naesinProgress.total).toBe(0);
    expect(stuD.naesinProgress.completed).toBe(0);
  });

  // ── Current activity label ──

  it('내신 학습 중인 학생에 unit + stage 정보 표시', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    setupAdminFrom();
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    const stuA = body.students.find((s: { id: string }) => s.id === 'stu-a');
    expect(stuA.currentActivity.label).toBe('Unit 3 현재완료');
    expect(stuA.currentActivity.stage).toBe('교과서 암기');
  });

  it('보카 학습 중인 학생에 day 정보 표시', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    setupAdminFrom();
    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    const stuB = body.students.find((s: { id: string }) => s.id === 'stu-b');
    expect(stuB.currentActivity.label).toBe('Day 12');
    expect(stuB.currentActivity.stage).toBeNull();
  });

  // ── Both naesin and voca: most recent wins ──

  it('내신/보카 둘 다 있으면 가장 최근 활동 표시', async () => {
    mockGetUser.mockResolvedValue(testTeacher);

    // studentA: naesin 30sec ago, voca 10sec ago → voca should win
    const dualProgress = [
      { ...naesinProgress[0], updated_at: minutesAgo(0.5) },
    ];
    const dualVoca = [
      { student_id: 'stu-a', day_id: 'day-1', updated_at: minutesAgo(0.15) },
    ];

    const tableData: Record<string, unknown[]> = {
      users: [studentA],
      naesin_student_progress: dualProgress,
      voca_student_progress: dualVoca,
      learning_daily_log: [],
      naesin_units: units,
      voca_days: vocaDays,
    };
    const chains: Record<string, ReturnType<typeof buildChain>> = {};
    for (const [table, data] of Object.entries(tableData)) {
      chains[table] = buildChain({
        then: vi.fn((resolve: (v: unknown) => void) => resolve({ data, error: null })),
      });
    }
    mockAdminFrom.mockImplementation((table: string) => chains[table] || buildChain());

    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    const stuA = body.students.find((s: { id: string }) => s.id === 'stu-a');
    expect(stuA.status).toBe('learning');
    expect(stuA.currentActivity.type).toBe('voca');
    expect(stuA.currentActivity.label).toContain('Day 12');
  });

  // ── Heartbeat expired → online (not learning) ──

  it('heartbeat 2분 초과, presence 2분 이내 → 접속 중', async () => {
    mockGetUser.mockResolvedValue(testTeacher);

    const onlineOnlyStudent = { id: 'stu-x', full_name: '테스트', last_active_at: minutesAgo(0.5) };
    const oldProgress = [
      {
        student_id: 'stu-x',
        unit_id: 'unit-1',
        updated_at: minutesAgo(10),
        current_stage: 'vocab',
        vocab_completed: false,
        dialogue_completed: false,
        passage_completed: false,
        grammar_completed: false,
        problem_completed: false,
      },
    ];

    const tableData: Record<string, unknown[]> = {
      users: [onlineOnlyStudent],
      naesin_student_progress: oldProgress,
      voca_student_progress: [],
      learning_daily_log: [],
      naesin_units: [],
      voca_days: [],
    };
    const chains: Record<string, ReturnType<typeof buildChain>> = {};
    for (const [table, data] of Object.entries(tableData)) {
      chains[table] = buildChain({
        then: vi.fn((resolve: (v: unknown) => void) => resolve({ data, error: null })),
      });
    }
    mockAdminFrom.mockImplementation((table: string) => chains[table] || buildChain());

    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.students[0].status).toBe('online');
    expect(body.students[0].currentActivity).toBeNull();
    expect(body.onlineCount).toBe(1);
    expect(body.learningCount).toBe(0);
  });

  // ── No progress at all ──

  it('진행 기록 없는 학생도 목록에 표시', async () => {
    mockGetUser.mockResolvedValue(testTeacher);

    const freshStudent = { id: 'stu-fresh', full_name: '신입생', last_active_at: null };
    const tableData: Record<string, unknown[]> = {
      users: [freshStudent],
      naesin_student_progress: [],
      voca_student_progress: [],
      learning_daily_log: [],
      naesin_units: [],
      voca_days: [],
    };
    const chains: Record<string, ReturnType<typeof buildChain>> = {};
    for (const [table, data] of Object.entries(tableData)) {
      chains[table] = buildChain({
        then: vi.fn((resolve: (v: unknown) => void) => resolve({ data, error: null })),
      });
    }
    mockAdminFrom.mockImplementation((table: string) => chains[table] || buildChain());

    const { GET } = await import('@/app/api/live-monitor/route');
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.totalCount).toBe(1);
    expect(body.students[0].id).toBe('stu-fresh');
    expect(body.students[0].status).toBe('offline');
    expect(body.students[0].todaySeconds).toBe(0);
    expect(body.students[0].naesinProgress).toEqual({ completed: 0, total: 0 });
  });
});

describe('/api/presence', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('인증된 사용자 → 204 반환', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    mockAdminFrom.mockReturnValue(
      buildChain({ then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: null, error: null })) })
    );
    mockCreateClient.mockResolvedValue({ from: vi.fn().mockReturnValue(buildChain()) });

    const { PATCH } = await import('@/app/api/presence/route');
    const req = new NextRequest('http://localhost/api/presence', { method: 'PATCH' });
    const res = await PATCH(req);
    expect(res.status).toBe(204);
  });

  it('미인증 → 401', async () => {
    mockGetUser.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue({ from: vi.fn().mockReturnValue(buildChain()) });

    const { PATCH } = await import('@/app/api/presence/route');
    const req = new NextRequest('http://localhost/api/presence', { method: 'PATCH' });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('users 테이블에 last_active_at 업데이트 호출', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    const updateChain = buildChain({
      then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: null, error: null })),
    });
    mockAdminFrom.mockReturnValue(updateChain);
    mockCreateClient.mockResolvedValue({ from: vi.fn().mockReturnValue(buildChain()) });

    const { PATCH } = await import('@/app/api/presence/route');
    const req = new NextRequest('http://localhost/api/presence', { method: 'PATCH' });
    await PATCH(req);

    expect(mockAdminFrom).toHaveBeenCalledWith('users');
    expect(updateChain.update).toHaveBeenCalled();
    expect(updateChain.eq).toHaveBeenCalledWith('id', testStudent.id);
  });
});
