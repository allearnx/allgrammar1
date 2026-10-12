import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testTeacher, testStudent } from '../../helpers/fixtures';
import { createMockRequest } from '../../helpers/api-test-utils';

const mockGetUser = vi.fn();
const mockCreateClient = vi.fn();
const mockExtract = vi.fn();
const mockParaphrase = vi.fn();
const mockVerify = vi.fn();
const mockStorageRemove = vi.fn().mockResolvedValue({});

vi.mock('@/lib/auth/helpers', () => ({ getUser: (...a: unknown[]) => mockGetUser(...a) }));
vi.mock('@/lib/supabase/server', () => ({ createClient: (...a: unknown[]) => mockCreateClient(...a) }));
vi.mock('@/lib/api/rate-limit', () => ({ checkRateLimit: () => null }));
vi.mock('@/lib/api/require-content-permission', () => ({ requireContentPermission: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@anthropic-ai/sdk', () => ({ default: class MockAnthropic { messages = {}; } }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ storage: { from: () => ({ remove: (...a: unknown[]) => mockStorageRemove(...a) }) } }),
}));
vi.mock('@/lib/naesin/extract-paraphrase-service', () => ({
  extractQuestionsFromPdf: (...a: unknown[]) => mockExtract(...a),
  paraphraseQuestions: (...a: unknown[]) => mockParaphrase(...a),
  verifyQuestions: (...a: unknown[]) => mockVerify(...a),
}));

const post = async (body: unknown) => {
  const { POST } = await import('@/app/api/naesin/problems/extract-paraphrase/route');
  return POST(createMockRequest('POST', body, 'http://localhost/api/naesin/problems/extract-paraphrase'));
};

const q = (n: number) => ({ number: n, question: `Q${n}`, answer: 'a', options: null });

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue(testTeacher);
  mockCreateClient.mockResolvedValue({});
});

describe('POST /api/naesin/problems/extract-paraphrase', () => {
  it('미인증 → 401', async () => {
    mockGetUser.mockResolvedValue(null);
    const res = await post({ unitId: 'u1', pdfBase64: 'x' });
    expect(res.status).toBe(401);
    expect(mockExtract).not.toHaveBeenCalled();
  });

  it('학생 → 403', async () => {
    mockGetUser.mockResolvedValue(testStudent);
    const res = await post({ unitId: 'u1', pdfBase64: 'x' });
    expect(res.status).toBe(403);
  });

  describe("phase 'paraphrase' / 'verify'", () => {
    it('questions 없으면 400', async () => {
      expect((await post({ phase: 'paraphrase', unitId: 'u1', questions: [] })).status).toBe(400);
      expect((await post({ phase: 'verify', unitId: 'u1' })).status).toBe(400);
      expect(mockParaphrase).not.toHaveBeenCalled();
      expect(mockVerify).not.toHaveBeenCalled();
    });

    it('paraphrase → 서비스에 문항·단원명 전달, {questions} 반환', async () => {
      mockParaphrase.mockResolvedValue({ questions: [q(1), q(2)], chunkCount: 1 });
      const res = await post({ phase: 'paraphrase', unitId: 'u1', unitTitle: '3과', questions: [q(1), q(2)] });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ questions: [q(1), q(2)] });
      expect(mockParaphrase).toHaveBeenCalledWith(expect.anything(), [q(1), q(2)], '3과');
      expect(mockExtract).not.toHaveBeenCalled();
    });

    it('verify → {issues} 반환', async () => {
      mockVerify.mockResolvedValue({ issues: [{ number: 2, verdict: 'wrong' }] });
      const res = await post({ phase: 'verify', unitId: 'u1', unitTitle: '3과', questions: [q(1), q(2)] });
      expect(await res.json()).toEqual({ issues: [{ number: 2, verdict: 'wrong' }] });
      expect(mockVerify).toHaveBeenCalledWith(expect.anything(), [q(1), q(2)], '3과');
    });
  });

  describe("phase 'extract'", () => {
    it('unitId 또는 PDF 없으면 400', async () => {
      expect((await post({ phase: 'extract', pdfBase64: 'x' })).status).toBe(400);
      expect((await post({ phase: 'extract', unitId: 'u1' })).status).toBe(400);
      expect(mockExtract).not.toHaveBeenCalled();
    });

    it('추출 0건 → 422', async () => {
      mockExtract.mockResolvedValue({ questions: [], extractedTotal: 0, removedImageCount: 0, chunkCount: 1, perChunk: [0], deduped: 0 });
      const res = await post({ phase: 'extract', unitId: 'u1', pdfBase64: 'x' });
      expect(res.status).toBe(422);
    });

    it('추출 성공 → 원본 문항 + 집계, 임시 업로드 삭제, 변형은 호출 안 함', async () => {
      mockExtract.mockResolvedValue({ questions: [q(1), q(2)], extractedTotal: 5, removedImageCount: 1, chunkCount: 2, perChunk: [3, 3], deduped: 1 });
      const res = await post({ phase: 'extract', unitId: 'u1', pdfUrl: 'https://x/a.pdf', storagePath: 'tmp/a.pdf', halfSampling: false });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ questions: [q(1), q(2)], originalCount: 2, extractedTotal: 5, removedImageCount: 1 });
      expect(mockExtract).toHaveBeenCalledWith(expect.anything(), { unitId: 'u1', pdfBase64: undefined, pdfUrl: 'https://x/a.pdf', halfSampling: false });
      expect(mockParaphrase).not.toHaveBeenCalled();
      await vi.waitFor(() => expect(mockStorageRemove).toHaveBeenCalledWith(['tmp/a.pdf']));
    });
  });

  describe('레거시(phase 없음): 추출 + 변형 한 번에', () => {
    it('변형 결과에 번호를 다시 매기고 구조 검증 결과를 붙인다', async () => {
      mockExtract.mockResolvedValue({ questions: [q(7), q(9)], extractedTotal: 2, removedImageCount: 0, chunkCount: 1, perChunk: [2], deduped: 0 });
      mockParaphrase.mockResolvedValue({
        questions: [
          { number: 7, question: 'P1 ______', answer: '1', options: ['a', 'b'] },
          { number: 9, question: 'P2', answer: 'word', options: null },
        ],
        chunkCount: 1,
      });
      const res = await post({ unitId: 'u1', unitTitle: '3과', pdfBase64: 'x' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.questions.map((x: { number: number }) => x.number)).toEqual([1, 2]);
      expect(body.originalCount).toBe(2);
      expect(body.validation.structural).toBeDefined();
      expect(mockParaphrase).toHaveBeenCalledWith(expect.anything(), [q(7), q(9)], '3과');
    });
  });

  it('서비스 예외 → 500 + 메시지', async () => {
    mockExtract.mockRejectedValue(new Error('AI 응답에서 JSON을 파싱할 수 없습니다.'));
    const res = await post({ phase: 'extract', unitId: 'u1', pdfBase64: 'x' });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('JSON');
  });
});
