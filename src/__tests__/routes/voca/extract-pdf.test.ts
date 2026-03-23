import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testTeacher, testStudent } from '../../helpers/fixtures';

const mockGetUser = vi.fn();

vi.mock('@/lib/auth/helpers', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}));
vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimit: () => null,
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

// Mock unpdf
vi.mock('unpdf', () => ({
  extractText: vi.fn().mockResolvedValue({
    text: ['apple banana cherry'],
    totalPages: 1,
  }),
}));

// Mock Anthropic
const mockStream = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { stream: mockStream };
  },
}));

function makeFormRequest(file?: File) {
  const formData = new FormData();
  if (file) formData.append('file', file);
  return new NextRequest('http://localhost/api/voca/vocabulary/extract-pdf', {
    method: 'POST',
    body: formData,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('voca/vocabulary/extract-pdf', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('응답에 유의어/반의어/숙어 포함', async () => {
    mockGetUser.mockResolvedValue(testTeacher);
    mockStream.mockReturnValue({
      finalMessage: () => Promise.resolve({
        content: [{ type: 'text', text: JSON.stringify([
          { w: 'happy', m: '행복한', p: 'adj.', s: 'glad, joyful', a: 'sad', i: [{ en: 'happy hour', ko: '할인 시간', example_en: 'Let\'s go to happy hour.', example_ko: '할인 시간에 가자.' }] },
          { w: 'run', m: '달리다', p: 'v.', s: 'sprint', a: null, i: null },
          { w: 'book', m: '책', p: 'n.', s: null, a: null, i: null },
        ]) }],
      }),
    });

    const { POST } = await import('@/app/api/voca/vocabulary/extract-pdf/route');
    const pdfBlob = new Blob(['fake pdf'], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], 'test.pdf', { type: 'application/pdf' });
    const res = await POST(makeFormRequest(pdfFile));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.items).toHaveLength(3);

    // happy — 유의어/반의어/숙어 있음
    expect(body.items[0].front_text).toBe('happy');
    expect(body.items[0].synonyms).toBe('glad, joyful');
    expect(body.items[0].antonyms).toBe('sad');
    expect(body.items[0].idioms).toHaveLength(1);
    expect(body.items[0].idioms[0].en).toBe('happy hour');

    // run — 유의어만
    expect(body.items[1].synonyms).toBe('sprint');
    expect(body.items[1].antonyms).toBeNull();
    expect(body.items[1].idioms).toBeNull();

    // book — 전부 null
    expect(body.items[2].synonyms).toBeNull();
    expect(body.items[2].antonyms).toBeNull();
    expect(body.items[2].idioms).toBeNull();
  });

  it('학생 권한 거부', async () => {
    mockGetUser.mockResolvedValue(testStudent);

    const { POST } = await import('@/app/api/voca/vocabulary/extract-pdf/route');
    const pdfBlob = new Blob(['fake pdf'], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], 'test.pdf', { type: 'application/pdf' });
    const res = await POST(makeFormRequest(pdfFile));
    expect(res.status).toBe(401);
  });

  it('PDF 아닌 파일 거부', async () => {
    mockGetUser.mockResolvedValue(testTeacher);

    const { POST } = await import('@/app/api/voca/vocabulary/extract-pdf/route');
    const txtFile = new File(['hello'], 'test.txt', { type: 'text/plain' });
    const res = await POST(makeFormRequest(txtFile));
    expect(res.status).toBe(400);
  });
});
